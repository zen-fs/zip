import { ApiError, ErrorCode } from '@browserfs/core/ApiError.js';
import { FileIndex, IndexDirInode, IndexFileInode, isIndexDirInode, isIndexFileInode } from '@browserfs/core/FileIndex.js';
import { CreateBackend, type BackendOptions } from '@browserfs/core/backends/backend.js';
import { ActionType, File, FileFlag, NoSyncFile } from '@browserfs/core/file.js';
import { FileSystemMetadata, SynchronousFileSystem } from '@browserfs/core/filesystem.js';
import { Stats } from '@browserfs/core/stats.js';
import { Buffer } from 'buffer';
import { CentralDirectory } from './file/CentralDirectory.js';
import { EndOfCentralDirectory } from './file/EndOfCentralDirectory.js';
import { TableOfContents } from './file/TableOfContents.js';

export namespace ZipFS {
	/**
	 * Configuration options for a ZipFS file system.
	 */
	export interface Options {
		/**
		 * The zip file as a binary buffer.
		 */
		zipData: Buffer;
		/**
		 * The name of the zip file (optional).
		 */
		name?: string;
	}
}

/**
 * Zip file-backed filesystem
 * Implemented according to the standard:
 * http://www.pkware.com/documents/casestudies/APPNOTE.TXT
 *
 * While there are a few zip libraries for JavaScript (e.g. JSZip and zip.js),
 * they are not a good match for BrowserFS. In particular, these libraries
 * perform a lot of unneeded data copying, and eagerly decompress every file
 * in the zip file upon loading to check the CRC32. They also eagerly decode
 * strings. Furthermore, these libraries duplicate functionality already present
 * in BrowserFS (e.g. UTF-8 decoding and binary data manipulation).
 *
 * This filesystem takes advantage of BrowserFS's Buffer implementation, which
 * efficiently represents the zip file in memory (in both ArrayBuffer-enabled
 * browsers *and* non-ArrayBuffer browsers), and which can neatly be 'sliced'
 * without copying data. Each struct defined in the standard is represented with
 * a buffer slice pointing to an offset in the zip file, and has getters for
 * each field. As we anticipate that this data will not be read often, we choose
 * not to store each struct field in the JavaScript object; instead, to reduce
 * memory consumption, we retrieve it directly from the binary data each time it
 * is requested.
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
export class ZipFS extends SynchronousFileSystem {
	public static readonly Name = 'ZipFS';

	public static Create = CreateBackend.bind(this);

	public static readonly Options: BackendOptions = {
		zipData: {
			type: 'object',
			description: 'The zip file as a Buffer object.',
			validator(buff: unknown) {
				if (!Buffer.isBuffer(buff)) {
					throw new ApiError(ErrorCode.EINVAL, 'option must be a Buffer.');
				}
			},
		},
		name: {
			type: 'string',
			optional: true,
			description: 'The name of the zip file (optional).',
		},
	};

	public static isAvailable(): boolean {
		return true;
	}

	/**
	 * Locates the end of central directory record at the end of the file.
	 * Throws an exception if it cannot be found.
	 */
	private static _getEOCD(data: Buffer): EndOfCentralDirectory {
		// Unfortunately, the comment is variable size and up to 64K in size.
		// We assume that the magic signature does not appear in the comment, and
		// in the bytes between the comment and the signature. Other ZIP
		// implementations make this same assumption, since the alternative is to
		// read thread every entry in the file to get to it. :(
		// These are *negative* offsets from the end of the file.
		const startOffset = 22;
		const endOffset = Math.min(startOffset + 0xffff, data.length - 1);
		// There's not even a byte alignment guarantee on the comment so we need to
		// search byte by byte. *grumble grumble*
		for (let i = startOffset; i < endOffset; i++) {
			// Magic number: EOCD Signature
			if (data.readUInt32LE(data.length - i) === 0x06054b50) {
				return new EndOfCentralDirectory(data.subarray(data.length - i));
			}
		}
		throw new ApiError(ErrorCode.EINVAL, 'Invalid ZIP file: Could not locate End of Central Directory signature.');
	}

	private static _addToIndex(cd: CentralDirectory, index: FileIndex<CentralDirectory>) {
		// Paths must be absolute, yet zip file paths are always relative to the
		// zip root. So we append '/' and call it a day.
		let filename = cd.fileName();
		if (filename.charAt(0) === '/') {
			throw new ApiError(ErrorCode.EPERM, `Unexpectedly encountered an absolute path in a zip file. Please file a bug.`);
		}
		// XXX: For the file index, strip the trailing '/'.
		if (filename.charAt(filename.length - 1) === '/') {
			filename = filename.substr(0, filename.length - 1);
		}

		if (cd.isDirectory()) {
			index.addPathFast('/' + filename, new IndexDirInode<CentralDirectory>(cd));
		} else {
			index.addPathFast('/' + filename, new IndexFileInode<CentralDirectory>(cd));
		}
	}

	private static async _computeIndex(data: Buffer): Promise<TableOfContents> {
		const index: FileIndex<CentralDirectory> = new FileIndex<CentralDirectory>();
		const eocd: EndOfCentralDirectory = ZipFS._getEOCD(data);
		if (eocd.diskNumber() !== eocd.cdDiskNumber()) {
			throw new ApiError(ErrorCode.EINVAL, 'ZipFS does not support spanned zip files.');
		}

		const cdPtr = eocd.cdOffset();
		if (cdPtr === 0xffffffff) {
			throw new ApiError(ErrorCode.EINVAL, 'ZipFS does not support Zip64.');
		}
		const cdEnd = cdPtr + eocd.cdSize();
		return ZipFS._computeIndexResponsive(data, index, cdPtr, cdEnd, [], eocd);
	}

	private static async _computeIndexResponsive(
		data: Buffer,
		index: FileIndex<CentralDirectory>,
		cdPtr: number,
		cdEnd: number,
		cdEntries: CentralDirectory[],
		eocd: EndOfCentralDirectory
	): Promise<TableOfContents> {
		if (cdPtr >= cdEnd) {
			return new TableOfContents(index, cdEntries, eocd, data);
		}

		let count = 0;
		while (count++ < 200 && cdPtr < cdEnd) {
			const cd: CentralDirectory = new CentralDirectory(data, data.subarray(cdPtr));
			ZipFS._addToIndex(cd, index);
			cdPtr += cd.totalSize();
			cdEntries.push(cd);
		}

		return ZipFS._computeIndexResponsive(data, index, cdPtr, cdEnd, cdEntries, eocd);
	}

	private _index: FileIndex<CentralDirectory> = new FileIndex<CentralDirectory>();
	private _directoryEntries: CentralDirectory[] = [];
	private _eocd: EndOfCentralDirectory | null = null;
	private data: Buffer;
	public readonly name: string;

	public constructor({ zipData, name = '' }: ZipFS.Options) {
		super();
		this.name = name;
		this._ready = ZipFS._computeIndex(zipData).then(zipTOC => {
			this._index = zipTOC.index;
			this._directoryEntries = zipTOC.directoryEntries;
			this._eocd = zipTOC.eocd;
			this.data = zipTOC.data;
			return this;
		});
	}

	public get metadata(): FileSystemMetadata {
		return {
			...super.metadata,
			name: ZipFS.Name + (this.name !== '' ? ` ${this.name}` : ''),
			readonly: true,
			synchronous: true,
			totalSpace: this.data.length,
		};
	}

	/**
	 * Get the CentralDirectory object for the given path.
	 */
	public getCentralDirectoryEntry(path: string): CentralDirectory {
		const inode = this._index.getInode(path);
		if (inode === null) {
			throw ApiError.ENOENT(path);
		}
		if (isIndexFileInode<CentralDirectory>(inode)) {
			return inode.getData();
		} else if (isIndexDirInode<CentralDirectory>(inode)) {
			return inode.getData()!;
		} else {
			// Should never occur.
			throw ApiError.EPERM(`Invalid inode: ${inode}`);
		}
	}

	public getCentralDirectoryEntryAt(index: number): CentralDirectory {
		const dirEntry = this._directoryEntries[index];
		if (!dirEntry) {
			throw new RangeError(`Invalid directory index: ${index}.`);
		}
		return dirEntry;
	}

	public getNumberOfCentralDirectoryEntries(): number {
		return this._directoryEntries.length;
	}

	public getEndOfCentralDirectory(): EndOfCentralDirectory | null {
		return this._eocd;
	}

	public statSync(path: string): Stats {
		const inode = this._index.getInode(path);
		if (inode === null) {
			throw ApiError.ENOENT(path);
		}
		let stats: Stats;
		if (isIndexFileInode<CentralDirectory>(inode)) {
			stats = inode.getData().getStats();
		} else if (isIndexDirInode(inode)) {
			stats = inode.getStats();
		} else {
			throw new ApiError(ErrorCode.EINVAL, 'Invalid inode.');
		}
		return stats;
	}

	public openSync(path: string, flags: FileFlag, mode: number): File {
		// INVARIANT: Cannot write to RO file systems.
		if (flags.isWriteable()) {
			throw new ApiError(ErrorCode.EPERM, path);
		}
		// Check if the path exists, and is a file.
		const inode = this._index.getInode(path);
		if (!inode) {
			throw ApiError.ENOENT(path);
		} else if (isIndexFileInode<CentralDirectory>(inode) || isIndexDirInode<CentralDirectory>(inode)) {
			const stats = !isIndexDirInode<CentralDirectory>(inode) ? inode.getData().getStats() : inode.getStats();
			const data = !isIndexDirInode<CentralDirectory>(inode) ? inode.getData().getData() : inode.getStats().fileData;
			switch (flags.pathExistsAction()) {
				case ActionType.THROW_EXCEPTION:
				case ActionType.TRUNCATE_FILE:
					throw ApiError.EEXIST(path);
				case ActionType.NOP:
					return new NoSyncFile(this, path, flags, stats, data || undefined);
				default:
					throw new ApiError(ErrorCode.EINVAL, 'Invalid FileMode object.');
			}
		} else {
			throw ApiError.EPERM(path);
		}
	}

	public readdirSync(path: string): string[] {
		// Check if it exists.
		const inode = this._index.getInode(path);
		if (!inode) {
			throw ApiError.ENOENT(path);
		} else if (isIndexDirInode(inode)) {
			return inode.getListing();
		} else {
			throw ApiError.ENOTDIR(path);
		}
	}

	/**
	 * Specially-optimized readfile.
	 */
	public readFileSync(fname: string, encoding: BufferEncoding, flag: FileFlag): any {
		// Get file.
		const fd = this.openSync(fname, flag, 0o644);
		try {
			const fdCast = <NoSyncFile<ZipFS>>fd;
			const fdBuff = <Buffer>fdCast.getBuffer();
			if (encoding === null) {
				return Buffer.from(fdBuff);
			}
			return fdBuff.toString(encoding);
		} finally {
			fd.closeSync();
		}
	}
}
