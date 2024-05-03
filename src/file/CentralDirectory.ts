import { ApiError, ErrorCode } from '@zenfs/core/ApiError.js';
import { FileType, Stats } from '@zenfs/core/stats.js';
import { CompressionMethod } from '../compression.js';
import { msdos2date, safeToString } from '../utils.js';
import { Data } from './Data.js';
import { FileHeader } from './Header.js';
import { deserialize, struct, types as t } from 'utilium';

/**
 * 4.3.12  Central directory structure:
 *
 *  central file header signature   4 bytes  (0x02014b50)
 *  version made by                 2 bytes
 *  version needed to extract       2 bytes
 *  general purpose bit flag        2 bytes
 *  compression method              2 bytes
 *  last mod file time              2 bytes
 *  last mod file date              2 bytes
 *  crc-32                          4 bytes
 *  compressed size                 4 bytes
 *  uncompressed size               4 bytes
 *  file name length                2 bytes
 *  extra field length              2 bytes
 *  file comment length             2 bytes
 *  disk number start               2 bytes
 *  internal file attributes        2 bytes
 *  external file attributes        4 bytes
 *  relative offset of local header 4 bytes
 *
 *  file name (variable size)
 *  extra field (variable size)
 *  file comment (variable size)
 */

export
@struct()
class CentralDirectory {
	/*
	The filename is loaded here, since looking it up is expensive

	 4.4.17.1 claims:
	 * All slashes are forward ('/') slashes.
	 * Filename doesn't begin with a slash.
	 * No drive letters or any nonsense like that.
	 * If filename is missing, the input came from standard input.
	 Unfortunately, this isn't true in practice.
	 Some Windows zip utilities use a backslash here,
	 but the correct Unix-style path in file headers.
	 To avoid seeking all over the file to recover the known-good filenames
	 from file headers, we simply convert '/' to '\' here.
	*/
	public readonly fileName: string;

	@t.uint32 public signature: number;

	constructor(
		protected zipData: ArrayBufferLike,
		protected _data: ArrayBufferLike
	) {
		deserialize(this, _data);
		// Sanity check.
		if (this.signature !== 33639248) {
			throw new ApiError(ErrorCode.EINVAL, 'Invalid Zip file: Central directory record has invalid signature: ' + this.signature);
		}

		this.fileName = safeToString(this._data, this.useUTF8, 46, this.fileNameLength).replace(/\\/g, '/');
	}

	@t.uint16 public versionMadeBy: number;

	@t.uint16 public versionNeeded: number;

	@t.uint16 public flag: number;

	@t.uint16 public compressionMethod: CompressionMethod;

	@t.uint16 protected _time: number;

	@t.uint16 protected _date: number;

	public get lastModFileTime(): Date {
		// Time and date is in MS-DOS format.
		return msdos2date(this._time, this._date);
	}

	@t.uint32 public crc32: number;

	@t.uint32 public compressedSize: number;

	@t.uint32 public uncompressedSize: number;

	@t.uint16 public fileNameLength: number;

	@t.uint16 public extraFieldLength: number;

	@t.uint16 public fileCommentLength: number;

	@t.uint16 public diskNumberStart: number;

	@t.uint16 public internalAttributes: number;

	@t.uint32 public externalAttributes: number;

	@t.uint32 public headerRelativeOffset: number;

	public get rawFileName(): ArrayBuffer {
		return this._data.slice(46, 46 + this.fileNameLength);
	}
	public get extraField(): ArrayBuffer {
		const start = 44 + this.fileNameLength;
		return this._data.slice(start, start + this.extraFieldLength);
	}
	public get fileComment(): string {
		const start = 46 + this.fileNameLength + this.extraFieldLength;
		return safeToString(this._data, this.useUTF8, start, this.fileCommentLength);
	}
	public get totalSize(): number {
		return 46 + this.fileNameLength + this.extraFieldLength + this.fileCommentLength;
	}
	public get isDirectory(): boolean {
		/* 
			NOTE: This assumes that the zip file implementation uses the lower byte
			of external attributes for DOS attributes for backwards-compatibility.
			This is not mandated, but appears to be commonplace.
			According to the spec, the layout of external attributes is platform-dependent.
			If that fails, we also check if the name of the file ends in '/'.
		*/
		return (this.externalAttributes & 16 ? true : false) || this.fileName.charAt(this.fileName.length - 1) === '/';
	}
	public get isFile(): boolean {
		return !this.isDirectory;
	}
	public get useUTF8(): boolean {
		return (this.flag & 2048) == 2048;
	}
	public get isEncrypted(): boolean {
		return (this.flag & 1) == 1;
	}
	public get fileData(): Data {
		// Need to grab the header before we can figure out where the actual compressed data starts.
		const start = this.headerRelativeOffset;
		const header = new FileHeader(this.zipData.slice(start));
		return new Data(header, this, this.zipData.slice(start + header.totalSize));
	}
	public get data(): Uint8Array {
		return this.fileData.decompress();
	}
	public get rawData(): ArrayBuffer {
		return this.fileData.data;
	}
	public get stats(): Stats {
		return new Stats({
			mode: 0o555 | FileType.FILE,
			size: this.uncompressedSize,
			mtimeMs: this.lastModFileTime.getTime(),
		});
	}
}
