import { ApiError, ErrorCode } from '@zenfs/core/ApiError.js';
import { FileIndex, IndexDirInode, IndexFileInode, SyncIndexFS } from '@zenfs/core/backends/Index.js';
import { type Backend } from '@zenfs/core/backends/backend.js';
import { NoSyncFile } from '@zenfs/core/file.js';
import type { FileSystemMetadata } from '@zenfs/core/filesystem.js';
import { Stats } from '@zenfs/core/stats.js';
import { CentralDirectory } from './file/CentralDirectory.js';
import { EndOfCentralDirectory } from './file/EndOfCentralDirectory.js';

/**
 * Contains the table of contents of a Zip file.
 */
export interface TableOfContents {
	index: FileIndex<CentralDirectory>;
	entries: CentralDirectory[];
	eocd: EndOfCentralDirectory;
	data: ArrayBuffer;
}

/**
 * Configuration options for a ZipFS file system.
 */
export interface ZipOptions {
	/**
	 * The zip file as a binary buffer.
	 */
	zipData: ArrayBufferLike;
	/**
	 * The name of the zip file (optional).
	 */
	name?: string;
}

/**
 * Zip file-backed filesystem
 * Implemented according to the standard:
 * http://www.pkware.com/documents/casestudies/APPNOTE.TXT
 *
 * While there are a few zip libraries for JavaScript (e.g. JSZip and zip.js),
 * they are not a good match for ZenFS. In particular, these libraries
 * perform a lot of unneeded data copying, and eagerly decompress every file
 * in the zip file upon loading to check the CRC32. They also eagerly decode
 * strings. Furthermore, these libraries duplicate functionality already present
 * in ZenFS (e.g. UTF-8 decoding and binary data manipulation).
 *
 * When the filesystem is instantiated, we determine the directory structure
 * of the zip file as quickly as possible. We lazily decompress and check the
 * CRC32 of files. We do not cache decompressed files; if this is a desired
 * feature, it is best implemented as a generic file system wrapper that can
 * cache data from arbitrary file systems.
 *
 * Current limitations:
 * * No encryption.
 * * No ZIP64 support.
 * * Read-only.
 *   Write support would require that we:
 *   - Keep track of changed/new files.
 *   - Compress changed files, and generate appropriate metadata for each.
 *   - Update file offsets for other files in the zip file.
 *   - Stream it out to a location.
 *   This isn't that bad, so we might do this at a later date.
 */
export class ZipFS extends SyncIndexFS<CentralDirectory> {
	/**
	 * Locates the end of central directory record at the end of the file.
	 * Throws an exception if it cannot be found.
	 * 
	 * @remarks
	 * Unfortunately, the comment is variable size and up to 64K in size.
	 * We assume that the magic signature does not appear in the comment,
	 * and in the bytes between the comment and the signature.
	 * Other ZIP implementations make this same assumption,
	 * since the alternative is to read thread every entry in the file.
	 * 
	 * Offsets in this function are negative (i.e. from the end of the file).
	 * 
	 * There is no byte alignment on the comment
	 */
	protected static _getEOCD(data: ArrayBufferLike): EndOfCentralDirectory {
		const view = new DataView(data);
		const startOffset = 22;
		const endOffset = Math.min(startOffset + 0xffff, data.byteLength - 1);
		// 
		for (let i = startOffset; i < endOffset; i++) {
			// Magic number: EOCD Signature
			if (view.getUint32(data.byteLength - i, true) === 0x6054b50) {
				return new EndOfCentralDirectory(data.slice(data.byteLength - i));
			}
		}
		throw new ApiError(ErrorCode.EINVAL, 'Invalid ZIP file: Could not locate End of Central Directory signature.');
	}

	protected static _addToIndex(cd: CentralDirectory, index: FileIndex<CentralDirectory>) {
		// Paths must be absolute, yet zip file paths are always relative to the
		// zip root. So we append '/' and call it a day.
		let filename = cd.fileName;
		if (filename[0] == '/') {
			throw new ApiError(ErrorCode.EPERM, 'Unexpectedly encountered an absolute path in a zip file. Please file a bug.');
		}
		// For the file index, strip the trailing '/'.
		if (filename.endsWith('/')) {
			filename = filename.slice(0, -1);
		}

		index.addFast('/' + filename, cd.isDirectory ? new IndexDirInode<CentralDirectory>(cd) : new IndexFileInode<CentralDirectory>(cd));
	}

	protected static async _computeIndex(data: ArrayBufferLike): Promise<TableOfContents> {
		const index: FileIndex<CentralDirectory> = new FileIndex<CentralDirectory>();
		const eocd: EndOfCentralDirectory = ZipFS._getEOCD(data);
		if (eocd.disk != eocd.cdDisk) {
			throw new ApiError(ErrorCode.EINVAL, 'ZipFS does not support spanned zip files.');
		}

		const cdPtr = eocd.cdOffset;
		if (cdPtr === 0xffffffff) {
			throw new ApiError(ErrorCode.EINVAL, 'ZipFS does not support Zip64.');
		}
		const cdEnd = cdPtr + eocd.cdSize;
		return ZipFS._computeIndexResponsive(data, index, cdPtr, cdEnd, [], eocd);
	}

	protected static async _computeIndexResponsive(
		data: ArrayBufferLike,
		index: FileIndex<CentralDirectory>,
		cdPtr: number,
		cdEnd: number,
		entries: CentralDirectory[],
		eocd: EndOfCentralDirectory
	): Promise<TableOfContents> {
		if (cdPtr >= cdEnd) {
			return {
				index,
				entries,
				eocd,
				data,
			};
		}

		while (cdPtr < cdEnd) {
			const cd: CentralDirectory = new CentralDirectory(data, data.slice(cdPtr));
			ZipFS._addToIndex(cd, index);
			cdPtr += cd.totalSize;
			entries.push(cd);
		}

		return ZipFS._computeIndexResponsive(data, index, cdPtr, cdEnd, entries, eocd);
	}

	public _index: FileIndex<CentralDirectory> = new FileIndex<CentralDirectory>();
	private _directoryEntries: CentralDirectory[] = [];
	private _eocd?: EndOfCentralDirectory = null;
	private data: ArrayBufferLike;
	public readonly name: string;

	protected async _initialize(zipData: ArrayBufferLike): Promise<void> {
		const zipTOC = await ZipFS._computeIndex(zipData);
		this._index = zipTOC.index;
		this._directoryEntries = zipTOC.entries;
		this._eocd = zipTOC.eocd;
		this.data = zipTOC.data;
		return;
	}

	protected _ready: Promise<void>;

	public async ready(): Promise<this> {
		await this._ready;
		return;
	}

	public constructor({ zipData, name = '' }: ZipOptions) {
		super({});
		this.name = name;
		this._ready = this._initialize(zipData);
	}

	public metadata(): FileSystemMetadata {
		return {
			...super.metadata(),
			name: ['zip', this.name].filter(e => e).join(':'),
			readonly: true,
			totalSpace: this.data.byteLength,
		};
	}

	/**
	 * Get the CentralDirectory object for the given path.
	 */
	public getCentralDirectoryEntry(path: string): CentralDirectory {
		const inode = this._index.get(path);
		if (!inode) {
			throw ApiError.With('ENOENT', path, 'getCentralDirectoryEntry');
		}
		if (inode.isDirectory()) {
			return inode.data;
		}
		if (inode.isFile()) {
			return inode.data!;
		}
		// Should never occur.
		throw ApiError.With('EPERM', 'Invalid inode: ' + inode, 'getCentralDirectoryEntry');
	}

	public getCentralDirectoryEntryAt(index: number): CentralDirectory {
		const dirEntry = this._directoryEntries[index];
		if (!dirEntry) {
			throw new RangeError('Invalid directory index: ' + index);
		}
		return dirEntry;
	}

	public get numberOfCentralDirectoryEntries(): number {
		return this._directoryEntries.length;
	}

	public get endOfCentralDirectory(): EndOfCentralDirectory | null {
		return this._eocd;
	}

	protected statFileInodeSync(inode: IndexFileInode<CentralDirectory>): Stats {
		return inode.data.stats;
	}

	protected openFileInodeSync(inode: IndexFileInode<CentralDirectory>, path: string, flag: string): NoSyncFile<this> {
		return new NoSyncFile(this, path, flag, this.statFileInodeSync(inode), inode.data.data);
	}
}

export const Zip = {
	name: 'Zip',

	options: {
		zipData: {
			type: 'object',
			required: true,
			description: 'The zip file as an ArrayBuffer object.',
			validator(buff: unknown) {
				if (!(buff instanceof ArrayBuffer)) {
					throw new ApiError(ErrorCode.EINVAL, 'option must be a ArrayBuffer.');
				}
			},
		},
		name: {
			type: 'string',
			required: false,
			description: 'The name of the zip file (optional).',
		},
	},

	isAvailable(): boolean {
		return true;
	},

	create(options: ZipOptions) {
		return new ZipFS(options);
	},
} satisfies Backend<ZipFS, ZipOptions>;
