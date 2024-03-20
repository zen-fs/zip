import { ApiError, ErrorCode } from '@browserfs/core/ApiError.js';
import type { Backend } from '@browserfs/core/backends/backend.js';
import type { Cred } from '@browserfs/core/cred.js';
import * as path from '@browserfs/core/emulation/path.js';
import { resolve } from '@browserfs/core/emulation/path.js';
import { FileFlag, NoSyncFile } from '@browserfs/core/file.js';
import { FileSystem, Readonly, Sync, type FileSystemMetadata } from '@browserfs/core/filesystem.js';
import { FileType, Stats } from '@browserfs/core/stats.js';
import { DirectoryRecord } from './DirectoryRecord.js';
import { PrimaryOrSupplementaryVolumeDescriptor, PrimaryVolumeDescriptor, SupplementaryVolumeDescriptor, VolumeDescriptor, VolumeDescriptorTypeCode } from './VolumeDescriptor.js';
import { PXEntry, TFEntry, TFFlags } from './entries.js';

/**
 * Options for IsoFS file system instances.
 */
export interface IsoOptions {
	/**
	 * The ISO file in a buffer.
	 */
	data: Uint8Array;
	/**
	 * The name of the ISO (optional; used for debug messages / identification via metadata.name).
	 */
	name?: string;
}

/**
 * Mounts an ISO file as a read-only file system.
 *
 * Supports:
 * * Vanilla ISO9660 ISOs
 * * Microsoft Joliet and Rock Ridge extensions to the ISO9660 standard
 */
export class IsoFS extends Readonly(Sync(FileSystem)) {
	private _data: ArrayBuffer;
	private _pvd: PrimaryOrSupplementaryVolumeDescriptor;
	private _root: DirectoryRecord;
	private _name: string;

	/**
	 * **Deprecated. Please use IsoFS.Create() method instead.**
	 *
	 * Constructs a read-only file system from the given ISO.
	 * @param data The ISO file in a buffer.
	 * @param name The name of the ISO (optional; used for debug messages / identification via getName()).
	 */
	constructor({ data, name = '' }: IsoOptions) {
		super();
		this._data = data.buffer;
		// Skip first 16 sectors.
		let vdTerminatorFound = false;
		let i = 16 * 2048;
		const candidateVDs = new Array<PrimaryOrSupplementaryVolumeDescriptor>();
		while (!vdTerminatorFound) {
			const slice = this._data.slice(i);
			const vd = new VolumeDescriptor(slice);
			switch (vd.type) {
				case VolumeDescriptorTypeCode.PrimaryVolumeDescriptor:
					candidateVDs.push(new PrimaryVolumeDescriptor(slice));
					break;
				case VolumeDescriptorTypeCode.SupplementaryVolumeDescriptor:
					candidateVDs.push(new SupplementaryVolumeDescriptor(slice));
					break;
				case VolumeDescriptorTypeCode.VolumeDescriptorSetTerminator:
					vdTerminatorFound = true;
					break;
			}
			i += 2048;
		}
		if (candidateVDs.length === 0) {
			throw new ApiError(ErrorCode.EIO, `Unable to find a suitable volume descriptor.`);
		}
		for (const v of candidateVDs) {
			// Take an SVD over a PVD.
			if (!this._pvd || this._pvd.type !== VolumeDescriptorTypeCode.SupplementaryVolumeDescriptor) {
				this._pvd = v;
			}
		}
		this._root = this._pvd.rootDirectoryEntry(this._data);
		this._name = name;
	}

	public metadata(): FileSystemMetadata {
		return {
			...super.metadata(),
			name: ['iso', this._name, this._pvd?.name, this._root && this._root.hasRockRidge && 'RockRidge'].filter(e => e).join(':'),
			synchronous: true,
			readonly: true,
			totalSpace: this._data.byteLength,
		};
	}

	public statSync(p: string): Stats {
		const record = this._getDirectoryRecord(p);
		if (!record) {
			throw ApiError.ENOENT(p);
		}
		return this._getStats(p, record)!;
	}

	public openFileSync(path: string, flag: FileFlag, cred: Cred): NoSyncFile<this> {
		if (flag.isWriteable()) {
			// Cannot write to RO file systems.
			throw new ApiError(ErrorCode.EPERM, path);
		}

		const record = this._getDirectoryRecord(path);
		if (!record) {
			throw ApiError.ENOENT(path);
		}

		if (record.isSymlink(this._data)) {
			return this.openFileSync(resolve(path, record.getSymlinkPath(this._data)), flag, cred);
		}
		const data = !record.isDirectory(this._data) ? record.getFile(this._data) : undefined;
		const stats = this._getStats(path, record)!;

		return new NoSyncFile(this, path, flag, stats, new Uint8Array(data));
	}

	public readdirSync(path: string): string[] {
		// Check if it exists.
		const record = this._getDirectoryRecord(path);
		if (!record) {
			throw ApiError.ENOENT(path);
		}

		if (record.isDirectory(this._data)) {
			return record.getDirectory(this._data).fileList.slice(0);
		}

		throw ApiError.ENOTDIR(path);
	}

	private _getDirectoryRecord(path: string): DirectoryRecord | null {
		// Special case.
		if (path === '/') {
			return this._root;
		}
		const components = path.split('/').slice(1);
		let dir = this._root;
		for (const component of components) {
			if (!dir.isDirectory(this._data)) {
				return;
			}
			dir = dir.getDirectory(this._data).getRecord(component);
			if (!dir) {
				return null;
			}
		}
		return dir;
	}

	private _getStats(p: string, record: DirectoryRecord): Stats | null {
		if (record.isSymlink(this._data)) {
			const newP = path.resolve(p, record.getSymlinkPath(this._data));
			const dirRec = this._getDirectoryRecord(newP);
			if (!dirRec) {
				return null;
			}
			return this._getStats(newP, dirRec);
		}

		let mode = 0o555;
		const date = record.recordingDate.getTime();
		let atime = date,
			mtime = date,
			ctime = date;
		if (record.hasRockRidge) {
			const entries = record.getSUEntries(this._data);
			for (const entry of entries) {
				if (entry instanceof PXEntry) {
					mode = entry.mode();
					continue;
				}

				if (!(entry instanceof TFEntry)) {
					continue;
				}
				const flags = entry.flags();
				if (flags & TFFlags.ACCESS) {
					atime = entry.access()!.getTime();
				}
				if (flags & TFFlags.MODIFY) {
					mtime = entry.modify()!.getTime();
				}
				if (flags & TFFlags.CREATION) {
					ctime = entry.creation()!.getTime();
				}
			}
		}
		// Mask out writeable flags. This is a RO file system.
		mode &= 0o555;
		return new Stats(record.isDirectory(this._data) ? FileType.DIRECTORY : FileType.FILE, record.dataLength, mode, atime, mtime, ctime);
	}
}

export const Iso: Backend = {
	name: 'Iso',

	isAvailable(): boolean {
		return true;
	},

	options: {
		data: {
			type: 'object',
			description: 'The ISO file in a buffer',
			validator(arg: unknown) {
				if (!(arg instanceof ArrayBuffer)) {
					throw new TypeError('data is not an ArrayBuffer');
				}
			},
		},
	},

	create(options: IsoOptions) {
		return new IsoFS(options);
	},
};
