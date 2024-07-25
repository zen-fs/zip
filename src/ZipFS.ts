import { NoSyncFile, Stats, flagToMode, isWriteable, type Cred } from '@zenfs/core';
import { type Backend } from '@zenfs/core/backends/backend.js';
import { S_IFDIR } from '@zenfs/core/emulation/constants.js';
import { parse } from '@zenfs/core/emulation/path.js';
import { Errno, ErrnoError } from '@zenfs/core/error.js';
import { FileSystem, Readonly, Sync, type FileSystemMetadata } from '@zenfs/core/filesystem.js';
import { FileEntry, Header } from './zip.js';

/**
 * Configuration options for a ZipFS file system.
 */
export interface ZipOptions {
	/**
	 * The zip file as a binary buffer.
	 */
	data: ArrayBufferLike;

	/**
	 * The name of the zip file (optional).
	 */
	name?: string;

	/**
	 * Whether to wait to initialize entries
	 */
	lazy?: boolean;
}

/**
 * Zip file-backed filesystem
 * Implemented according to the standard:
 * http://pkware.com/documents/casestudies/APPNOTE.TXT
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
export class ZipFS extends Readonly(Sync(FileSystem)) {
	protected files: Map<string, FileEntry> = new Map();
	protected directories: Map<string, string[]> = new Map();

	protected _time = Date.now();

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
	protected static computeEOCD(data: ArrayBufferLike): Header {
		const view = new DataView(data);
		const start = 22;
		const end = Math.min(start + 0xffff, data.byteLength - 1);
		for (let i = start; i < end; i++) {
			// Magic number: EOCD Signature
			if (view.getUint32(data.byteLength - i, true) === 0x6054b50) {
				return new Header(data.slice(data.byteLength - i));
			}
		}
		throw new ErrnoError(Errno.EINVAL, 'Invalid ZIP file: Could not locate End of Central Directory signature.');
	}

	public readonly eocd: Header;

	public get endOfCentralDirectory(): Header {
		return this.eocd;
	}

	public constructor(
		public readonly name: string,
		protected data: ArrayBufferLike
	) {
		super();

		this.eocd = ZipFS.computeEOCD(data);
		if (this.eocd.disk != this.eocd.entriesDisk) {
			throw new ErrnoError(Errno.EINVAL, 'ZipFS does not support spanned zip files.');
		}

		let ptr = this.eocd.offset;

		if (ptr === 0xffffffff) {
			throw new ErrnoError(Errno.EINVAL, 'ZipFS does not support Zip64.');
		}
		const cdEnd = ptr + this.eocd.size;

		while (ptr < cdEnd) {
			const cd = new FileEntry(this.data, this.data.slice(ptr));
			/* 	Paths must be absolute,
			yet zip file paths are always relative to the zip root.
			So we prepend '/' and call it a day. */
			if (cd.name.startsWith('/')) {
				throw new ErrnoError(Errno.EPERM, 'Unexpectedly encountered an absolute path in a zip file.');
			}
			// Strip the trailing '/' if it exists
			const name = cd.name.endsWith('/') ? cd.name.slice(0, -1) : cd.name;
			this.files.set('/' + name, cd);
			ptr += cd.size;
		}

		// Parse directories
		for (const entry of this.files.keys()) {
			const { dir, base } = parse(entry);

			if (!this.directories.has(dir)) {
				this.directories.set(dir, []);
			}

			this.directories.get(dir).push(base);
		}
	}

	public metadata(): FileSystemMetadata {
		return {
			...super.metadata(),
			name: ['zip', this.name].filter(e => e).join(':'),
			readonly: true,
			totalSpace: this.data.byteLength,
		};
	}

	public get numberOfCentralDirectoryEntries(): number {
		return this.files.size;
	}

	public statSync(path: string): Stats {
		// The EOCD/Header does not track directories, so it does not exist in `entries`
		if (this.directories.has(path)) {
			return new Stats({
				mode: 0o555 | S_IFDIR,
				size: 4096,
				mtimeMs: this._time,
				ctimeMs: this._time,
				atimeMs: Date.now(),
				birthtimeMs: this._time,
			});
		}

		if (this.files.has(path)) {
			return this.files.get(path).stats;
		}

		throw ErrnoError.With('ENOENT', path, 'stat');
	}

	public openFileSync(path: string, flag: string, cred: Cred): NoSyncFile<this> {
		if (isWriteable(flag)) {
			// You can't write to files on this file system.
			throw new ErrnoError(Errno.EPERM, path);
		}

		const stats = this.statSync(path);

		if (!stats.hasAccess(flagToMode(flag), cred)) {
			throw ErrnoError.With('EACCES', path, 'openFile');
		}

		return new NoSyncFile(this, path, flag, stats, stats.isDirectory() ? stats.fileData : this.files.get(path).data);
	}

	public readdirSync(path: string): string[] {
		const stats = this.statSync(path);

		if (!stats.isDirectory()) {
			throw ErrnoError.With('ENOTDIR', path, 'readdir');
		}

		return this.directories.get(path);
	}
}

export const Zip = {
	name: 'Zip',

	options: {
		data: {
			type: 'object',
			required: true,
			description: 'The zip file as an ArrayBuffer object.',
			validator(buff: unknown) {
				if (!(buff instanceof ArrayBuffer)) {
					throw new ErrnoError(Errno.EINVAL, 'option must be a ArrayBuffer.');
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

	create(options: ZipOptions): ZipFS {
		return new ZipFS(options.name, options.data);
	},
} satisfies Backend<ZipFS, ZipOptions>;
