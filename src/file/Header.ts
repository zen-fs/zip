import { ApiError, ErrorCode } from '@zenfs/core/ApiError.js';
import { CompressionMethod } from '../compression.js';
import { msdos2date, safeToString } from '../utils.js';
import { deserialize, struct, types as t } from 'utilium';

/**
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.7
 */
export
@struct()
class FileHeader {
	constructor(protected data: ArrayBufferLike) {
		deserialize(this, data);
		if (this.signature !== 0x4034b50) {
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
