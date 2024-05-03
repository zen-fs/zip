import { ApiError, ErrorCode } from '@zenfs/core/ApiError.js';
import { FileType, Stats } from '@zenfs/core/stats.js';
import { deserialize, sizeof, struct, types as t } from 'utilium';
import { CompressionMethod, decompressionMethods } from './compression.js';
import { msdos2date, safeToString } from './utils.js';

/**
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.2.2
 */
export enum AttributeCompat {
	MSDOS = 0,
	AMIGA = 1,
	OPENVMS = 2,
	UNIX = 3,
	VM_CMS = 4,
	ATARI_ST = 5,
	OS2_HPFS = 6,
	MAC = 7,
	Z_SYSTEM = 8,
	CP_M = 9,
	NTFS = 10,
	MVS = 11,
	VSE = 12,
	ACORN_RISC = 13,
	VFAT = 14,
	ALT_MVS = 15,
	BEOS = 16,
	TANDEM = 17,
	OS_400 = 18,
	OSX = 19,
}

/**
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.7
 */
export
@struct()
class LocalFileHeader {
	constructor(protected data: ArrayBufferLike) {
		deserialize(this, data);
		if (this.signature !== 0x04034b50) {
			throw new ApiError(ErrorCode.EINVAL, 'Invalid Zip file: Local file header has invalid signature: ' + this.signature);
		}
	}

	@t.uint32 public signature: number;

	/**
	 * The minimum supported ZIP specification version needed to extract the file.
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.3
	 */
	@t.uint16 public versionNeeded: number;

	/**
	 * General purpose bit flags
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.4
	 */
	@t.uint16 public flags: number;

	/**
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.5
	 */
	@t.uint16 public compressionMethod: CompressionMethod;

	/**
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.6
	 */
	@t.uint16 protected _time: number;

	/**
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.6
	 */
	@t.uint16 protected _date: number;

	/**
	 * The date and time are encoded in standard MS-DOS format.
	 * This getter decodes the date.
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.6
	 */
	public get lastModified(): Date {
		// Time and date is in MS-DOS format.
		return msdos2date(this._time, this._date);
	}

	/**
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.7
	 */
	@t.uint32 public crc32: number;

	/**
	 * The size of the file compressed.
	 * If bit 3 of the general purpose bit flag is set, set to zero.
	 * central directory's entry is used
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.8
	 */
	@t.uint32 public compressedSize: number;

	/**
	 * The size of the file uncompressed
	 * If bit 3 of the general purpose bit flag is set, set to zero.
	 * central directory's entry is used
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.9
	 */
	@t.uint32 public uncompressedSize: number;

	/**
	 * The length of the file name
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.10
	 */
	@t.uint16 public nameLength: number;

	/**
	 * The length of the extra field
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.11
	 */
	@t.uint16 public extraLength: number;

	/**
	 * The name of the file, with optional relative path.
	 * @see CentralDirectory.fileName
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.17
	 */
	public get name(): string {
		return safeToString(this.data, this.useUTF8, 30, this.nameLength);
	}

	/**
	 * This should be used for storage expansion.
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.28
	 */
	public get extra(): ArrayBuffer {
		const start = 30 + this.nameLength;
		return this.data.slice(start, start + this.extraLength);
	}

	public get totalSize(): number {
		return 30 + this.nameLength + this.extraLength;
	}
	public get useUTF8(): boolean {
		return !!(this.flags & (1 << 11));
	}
}

/**
 * Archive extra data record
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.11
 */
export
@struct()
class ExtraDataRecord {
	@t.uint32 public signature: number;

	@t.uint32 public length: number;

	constructor(public readonly data: ArrayBufferLike) {
		deserialize(this, data);
		if (this.signature != 0x08064b50) {
			throw new ApiError(ErrorCode.EINVAL, 'Invalid archive extra data record signature: ' + this.signature);
		}
	}

	/**
	 * This should be used for storage expansion.
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.28
	 */
	public get extraField(): ArrayBuffer {
		return this.data.slice(8, 8 + this.length);
	}
}

/**
 * Refered to as a "central directory" record in the spec.
 * This is a file metadata entry inside the "central directory".
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.12
 */
export
@struct()
class FileEntry {
	constructor(
		protected zipData: ArrayBufferLike,
		protected _data: ArrayBufferLike
	) {
		deserialize(this, _data);
		// Sanity check.
		if (this.signature != 0x02014b50) {
			throw new ApiError(ErrorCode.EINVAL, 'Invalid Zip file: Central directory record has invalid signature: ' + this.signature);
		}

		const size = sizeof(FileEntry);
		this.name = safeToString(this._data, this.useUTF8, size, this.nameLength).replace(/\\/g, '/');
		this.comment = safeToString(this._data, this.useUTF8, size + this.nameLength + this.extraFieldLength, this.commentLength);
	}

	@t.uint32 public signature: number;

	/**
	 * The lower byte of "version made by", indicates the ZIP specification version supported by the software used to encode the file.
	 * major — floor `zipVersion` / 10
	 * minor — `zipVersion` mod 10
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.2
	 */
	@t.uint8 public zipVersion: number;

	/**
	 * The upper byte of "version made by", indicates the compatibility of the file attribute information.
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.2
	 */
	@t.uint8 public attributeCompat: AttributeCompat;

	/**
	 * The minimum supported ZIP specification version needed to extract the file.
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.3
	 */
	@t.uint16 public versionNeeded: number;

	/**
	 * General purpose bit flags
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.4
	 */
	@t.uint16 public flag: number;

	public get useUTF8(): boolean {
		return !!(this.flag & (1 << 11));
	}
	public get isEncrypted(): boolean {
		return !!(this.flag & 1);
	}

	/**
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.5
	 */
	@t.uint16 public compressionMethod: CompressionMethod;

	/**
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.6
	 */
	@t.uint16 protected _time: number;

	/**
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.6
	 */
	@t.uint16 protected _date: number;

	/**
	 * The date and time are encoded in standard MS-DOS format.
	 * This getter decodes the date.
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.6
	 */
	public get lastModifiedFileTime(): Date {
		// Time and date is in MS-DOS format.
		return msdos2date(this._time, this._date);
	}

	/**
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.7
	 */
	@t.uint32 public crc32: number;

	/**
	 * The size of the file compressed
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.8
	 */
	@t.uint32 public compressedSize: number;

	/**
	 * The size of the file uncompressed
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.9
	 */
	@t.uint32 public uncompressedSize: number;

	/**
	 * The length of the file name
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.10
	 */
	@t.uint16 public nameLength: number;

	/**
	 * The length of the extra field
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.11
	 */
	@t.uint16 public extraFieldLength: number;

	/**
	 * The length of the comment
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.12
	 */
	@t.uint16 public commentLength: number;

	/**
	 * The number of the disk on which this file begins.
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.13
	 */
	@t.uint16 public diskNumberStart: number;

	/**
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.14
	 */
	@t.uint16 public internalAttributes: number;

	/**
	 * The mapping of the external attributes is host-system dependent.
	 * For MS-DOS, the low order byte is the MS-DOS directory attribute byte.
	 * If input came from standard input, this field is set to zero.
	 * @see attributeCompat
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.15
	 */
	@t.uint32 public externalAttributes: number;

	/**
	 * This is the offset from the start of the first disk on which this file appears,
	 * to where the local header should be found.
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.16
	 */
	@t.uint32 public headerRelativeOffset: number;

	/**
	 * The name of the file, with optional relative path.
	 * The filename is preloaded here, since looking it up is expensive.
	 *
	 * 4.4.17.1 claims:
	 * - All slashes are forward ('/') slashes.
	 * - Filename doesn't begin with a slash.
	 * - No drive letters
	 * - If filename is missing, the input came from standard input.
	 *
	 * Unfortunately, this isn't true in practice.
	 * Some Windows zip utilities use a backslash here, but the correct Unix-style path in file headers.
	 * To avoid seeking all over the file to recover the known-good filenames from file headers, we simply convert '/' to '\' here.
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.17
	 */
	public readonly name: string;

	/**
	 * This should be used for storage expansion.
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.28
	 */
	public get extraField(): ArrayBuffer {
		const offset = 44 + this.nameLength;
		return this._data.slice(offset, offset + this.extraFieldLength);
	}

	/**
	 * The comment for this file
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.18
	 */
	public readonly comment: string;

	public get totalSize(): number {
		return sizeof(FileEntry) + this.nameLength + this.extraFieldLength + this.commentLength;
	}

	public get isDirectory(): boolean {
		/* 
			NOTE: This assumes that the zip file implementation uses the lower byte
			of external attributes for DOS attributes for backwards-compatibility.
			This is not mandated, but appears to be commonplace.
			According to the spec, the layout of external attributes is platform-dependent.
			If that fails, we also check if the name of the file ends in '/'.
		*/
		return !!(this.externalAttributes & 16) || this.name.endsWith('/');
	}

	public get isFile(): boolean {
		return !this.isDirectory;
	}

	/**
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.8
	 */
	public get data(): Uint8Array {
		// Need to grab the local header before we can figure out where the actual compressed data starts.
		const header = new LocalFileHeader(this.zipData.slice(this.headerRelativeOffset));
		const data = this.zipData.slice(this.headerRelativeOffset + header.totalSize);
		// Check the compression
		const { compressionMethod } = header;
		const decompress = decompressionMethods[compressionMethod];
		if (typeof decompress != 'function') {
			const name: string = compressionMethod in CompressionMethod ? CompressionMethod[compressionMethod] : compressionMethod.toString();
			throw new ApiError(ErrorCode.EINVAL, `Invalid compression method on file '${header.name}': ${name}`);
		}
		return decompress(data, this.compressedSize, this.uncompressedSize, this.flag);
	}

	public get stats(): Stats {
		return new Stats({
			mode: 0o555 | FileType.FILE,
			size: this.uncompressedSize,
			mtimeMs: this.lastModifiedFileTime.getTime(),
		});
	}
}

/**
 * Digital signature
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.13
 */
export
@struct()
class DigitalSignature {
	constructor(protected data: ArrayBufferLike) {
		deserialize(this, data);
		if (this.signature != 0x05054b50) {
			throw new ApiError(ErrorCode.EINVAL, 'Invalid digital signature signature: ' + this.signature);
		}
	}

	@t.uint32 public signature: number;

	@t.uint16 public size: number;

	public get signatureData(): ArrayBuffer {
		return this.data.slice(6, 6 + this.size);
	}
}

/**
 * Overall ZIP file header.
 * Internally, ZIP files have only a single directory: the "central directory".
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.16
 */
export
@struct()
class Header {
	constructor(protected data: ArrayBufferLike) {
		deserialize(this, data);
		if (this.signature != 0x06054b50) {
			throw new ApiError(ErrorCode.EINVAL, 'Invalid Zip file: End of central directory record has invalid signature: 0x' + this.signature.toString(16));
		}
	}

	@t.uint32 public signature: number;

	/**
	 * The number of this disk
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.19
	 */
	@t.uint16 public disk: number;

	/**
	 * The number of the disk with the start of the entries
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.20
	 */
	@t.uint16 public entriesDisk: number;

	/**
	 * Total number of entries on this disk
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.21
	 */
	@t.uint16 public diskEntryCount: number;

	/**
	 * Total number of entries
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.22
	 */
	@t.uint16 public totalEntryCount: number;

	/**
	 * Size of the "central directory"
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.23
	 */
	@t.uint32 public size: number;

	/**
	 * Offset of start of "central directory" with respect to the starting disk number
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.24
	 */
	@t.uint32 public offset: number;

	/**
	 * Comment length
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.25
	 */
	@t.uint16 public commentLength: number;

	/**
	 * Assuming the content is UTF-8 encoded. The specification doesn't specify.
	 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.26
	 */
	public get comment(): string {
		return safeToString(this.data, true, 22, this.commentLength);
	}
}
