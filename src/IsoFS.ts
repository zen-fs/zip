import { ApiError, ErrorCode } from '@browserfs/core/ApiError.js';
import { BackendOptions, CreateBackend } from '@browserfs/core/backends/backend.js';
import * as path from '@browserfs/core/emulation/path.js';
import { ActionType, FileFlag, NoSyncFile } from '@browserfs/core/file.js';
import { FileSystemMetadata, SynchronousFileSystem } from '@browserfs/core/filesystem.js';
import { FileType, Stats } from '@browserfs/core/stats.js';
import { DirectoryRecord } from './DirectoryRecord.js';
import { PrimaryOrSupplementaryVolumeDescriptor, PrimaryVolumeDescriptor, SupplementaryVolumeDescriptor, VolumeDescriptor, VolumeDescriptorTypeCode } from './VolumeDescriptor.js';
import { PXEntry, TFEntry, TFFlags } from './entries.js';

export namespace IsoFS {
	/**
	 * Options for IsoFS file system instances.
	 */
	export interface Options {
		/**
		 * The ISO file in a buffer.
		 */
		data: Uint8Array;
		/**
		 * The name of the ISO (optional; used for debug messages / identification via metadata.name).
		 */
		name?: string;
	}
}

/**
 * Mounts an ISO file as a read-only file system.
 *
 * Supports:
 * * Vanilla ISO9660 ISOs
 * * Microsoft Joliet and Rock Ridge extensions to the ISO9660 standard
 */
export class IsoFS extends SynchronousFileSystem {
	public static readonly Name = 'IsoFS';

	public static Create = CreateBackend.bind(this);

	public static readonly Options: BackendOptions = {
		data: {
			type: 'object',
			description: 'The ISO file in a buffer',
			validator(arg: unknown) {
				if (!(arg instanceof ArrayBuffer)) {
					throw new TypeError('');
				}
			},
		},
	};

	public static isAvailable(): boolean {
		return true;
	}

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
	constructor({ data, name = '' }: IsoFS.Options) {
		super();
		this._data = data;
		// Skip first 16 sectors.
		let vdTerminatorFound = false;
		let i = 16 * 2048;
		const candidateVDs = new Array<PrimaryOrSupplementaryVolumeDescriptor>();
		while (!vdTerminatorFound) {
			const slice = data.subarray(i);
			const vd = new VolumeDescriptor(slice);
			switch (vd.type()) {
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
		candidateVDs.forEach(v => {
			// Take an SVD over a PVD.
			if (!this._pvd || this._pvd.type() !== VolumeDescriptorTypeCode.SupplementaryVolumeDescriptor) {
				this._pvd = v;
			}
		});
		this._root = this._pvd.rootDirectoryEntry(data);
		this._name = name;
	}

	public get metadata(): FileSystemMetadata {
		let name = `IsoFS${this._name}${this._pvd ? `-${this._pvd.name()}` : ''}`;
		if (this._root && this._root.hasRockRidge()) {
			name += `-RockRidge`;
		}
		return {
			...super.metadata,
			name,
			synchronous: true,
			readonly: true,
			totalSpace: this._data.byteLength,
		};
	}

	public statSync(p: string): Stats {
		const record = this._getDirectoryRecord(p);
		if (record === null) {
			throw ApiError.ENOENT(p);
		}
		return this._getStats(p, record)!;
	}

	public openSync(p: string, flags: FileFlag, mode: number): NoSyncFile<this> {
		// INVARIANT: Cannot write to RO file systems.
		if (flags.isWriteable()) {
			throw new ApiError(ErrorCode.EPERM, p);
		}
		// Check if the path exists, and is a file.
		const record = this._getDirectoryRecord(p);
		if (!record) {
			throw ApiError.ENOENT(p);
		} else if (record.isSymlink(this._data)) {
			return this.openSync(path.resolve(p, record.getSymlinkPath(this._data)), flags, mode);
		} else {
			const data = !record.isDirectory(this._data) ? record.getFile(this._data) : undefined;
			const stats = this._getStats(p, record)!;
			switch (flags.pathExistsAction()) {
				case ActionType.THROW_EXCEPTION:
				case ActionType.TRUNCATE_FILE:
					throw ApiError.EEXIST(p);
				case ActionType.NOP:
					return new NoSyncFile(this, p, flags, stats, new Uint8Array(data));
				default:
					throw new ApiError(ErrorCode.EINVAL, 'Invalid FileMode object.');
			}
		}
	}

	public readdirSync(path: string): string[] {
		// Check if it exists.
		const record = this._getDirectoryRecord(path);
		if (!record) {
			throw ApiError.ENOENT(path);
		} else if (record.isDirectory(this._data)) {
			return record.getDirectory(this._data).getFileList().slice(0);
		} else {
			throw ApiError.ENOTDIR(path);
		}
	}

	/**
	 * Specially-optimized readfile.
	 */
	public readFileSync(fname: string, flag: FileFlag): Uint8Array {
		// Get file.
		const fd = this.openSync(fname, flag, 0o644);
		try {
			return fd.getBuffer();
		} finally {
			fd.closeSync();
		}
	}

	private _getDirectoryRecord(path: string): DirectoryRecord | null {
		// Special case.
		if (path === '/') {
			return this._root;
		}
		const components = path.split('/').slice(1);
		let dir = this._root;
		for (const component of components) {
			if (dir.isDirectory(this._data)) {
				dir = dir.getDirectory(this._data).getRecord(component);
				if (!dir) {
					return null;
				}
			} else {
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
		} else {
			const len = record.dataLength();
			let mode = 0x16d;
			const date = record.recordingDate().getTime();
			let atime = date;
			let mtime = date;
			let ctime = date;
			if (record.hasRockRidge()) {
				const entries = record.getSUEntries(this._data);
				for (const entry of entries) {
					if (entry instanceof PXEntry) {
						mode = entry.mode();
					} else if (entry instanceof TFEntry) {
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
			}
			// Mask out writeable flags. This is a RO file system.
			mode = mode & 0x16d;
			return new Stats(record.isDirectory(this._data) ? FileType.DIRECTORY : FileType.FILE, len, mode, atime, mtime, ctime);
		}
	}
}
