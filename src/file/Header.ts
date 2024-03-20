import { ApiError, ErrorCode } from '@browserfs/core/ApiError.js';
import { CompressionMethod } from '../compression.js';
import { msdos2date, safeToString } from '../utils.js';

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
export class FileHeader {
	protected _view: DataView;
	constructor(private data: ArrayBufferLike) {
		this._view = new DataView(data);
		if (this._view.getUint32(0, true) !== 67324752) {
			throw new ApiError(ErrorCode.EINVAL, 'Invalid Zip file: Local file header has invalid signature: ' + this._view.getUint32(0, true));
		}
	}
	public get versionNeeded(): number {
		return this._view.getUint16(4, true);
	}
	public get flags(): number {
		return this._view.getUint16(6, true);
	}
	public get compressionMethod(): CompressionMethod {
		return this._view.getUint16(8, true);
	}
	public get lastModFileTime(): Date {
		// Time and date is in MS-DOS format.
		return msdos2date(this._view.getUint16(10, true), this._view.getUint16(12, true));
	}
	public get rawLastModFileTime(): number {
		return this._view.getUint32(10, true);
	}
	public get crc32(): number {
		return this._view.getUint32(14, true);
	}
	/**
	 * These two values are COMPLETELY USELESS.
	 *
	 * Section 4.4.9:
	 *   If bit 3 of the general purpose bit flag is set,
	 *   these fields are set to zero in the local header and the
	 *   correct values are put in the data descriptor and
	 *   in the central directory.
	 *
	 * So we'll just use the central directory's values.
	 */
	// public compressedSize(): number { return this._view.getUint32(18, true); }
	// public uncompressedSize(): number { return this._view.getUint32(22, true); }
	public get fileNameLength(): number {
		return this._view.getUint16(26, true);
	}
	public get extraFieldLength(): number {
		return this._view.getUint16(28, true);
	}
	public get fileName(): string {
		return safeToString(this.data, this.useUTF8, 30, this.fileNameLength);
	}
	public get extraField(): ArrayBuffer {
		const start = 30 + this.fileNameLength;
		return this.data.slice(start, start + this.extraFieldLength);
	}
	public get totalSize(): number {
		return 30 + this.fileNameLength + this.extraFieldLength;
	}
	public get useUTF8(): boolean {
		return (this.flags & 2048) === 2048;
	}
}
