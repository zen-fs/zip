import { ApiError, ErrorCode } from '@zenfs/core/ApiError.js';
import { CompressionMethod } from '../compression.js';
import { msdos2date, safeToString } from '../utils.js';
import { deserialize, struct, types as t } from 'utilium';

/*
   4.3.6 Overall .ZIP file format:

	  [local file header 1]
	  [encryption header 1]
	  [file data 1]
	  [data descriptor 1]
	  .
	  .
	  .
	  [local file header n]
	  [encryption header n]
	  [file data n]
	  [data descriptor n]
	  [archive decryption header]
	  [archive extra data record]
	  [central directory header 1]
	  .
	  .
	  .
	  [central directory header n]
	  [zip64 end of central directory record]
	  [zip64 end of central directory locator]
	  [end of central directory record]
*/

/**
 * 4.3.7  Local file header:
 *
 *     local file header signature     4 bytes  (0x04034b50)
 *     version needed to extract       2 bytes
 *     general purpose bit flag        2 bytes
 *     compression method              2 bytes
 *    last mod file time              2 bytes
 *    last mod file date              2 bytes
 *    crc-32                          4 bytes
 *    compressed size                 4 bytes
 *    uncompressed size               4 bytes
 *    file name length                2 bytes
 *    extra field length              2 bytes
 *
 *    file name (variable size)
 *    extra field (variable size)
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

	@t.uint16 public versionNeeded: number;

	@t.uint16 public flags: number;

	@t.uint16 public compressionMethod: CompressionMethod;

	@t.uint16 protected _time: number;

	@t.uint16 protected _date: number;

	public get lastModified(): Date {
		// Time and date is in MS-DOS format.
		return msdos2date(this._time, this._date);
	}

	@t.uint32 public crc32: number;
	/**
	 *
	 * Section 4.4.9:
	 * 	If bit 3 of the general purpose bit flag is set,
	 * 	these fields are set to zero in the local header and the
	 * 	correct values are put in the data descriptor and
	 * 	in the central directory.
	 *
	 * So we'll just use the central directory's values.
	 *
	 */
	@t.uint32 public compressedSize: number;
	@t.uint32 public uncompressedSize: number;

	@t.uint16 public nameLength: number;
	@t.uint16 public extraLength: number;
	public get name(): string {
		return safeToString(this.data, this.useUTF8, 30, this.nameLength);
	}
	public get extra(): ArrayBuffer {
		const start = 30 + this.nameLength;
		return this.data.slice(start, start + this.extraLength);
	}
	public get totalSize(): number {
		return 30 + this.nameLength + this.extraLength;
	}
	public get useUTF8(): boolean {
		return (this.flags & 2048) === 2048;
	}
}
