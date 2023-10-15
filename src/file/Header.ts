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
	constructor(private data: Buffer) {
		if (data.readUInt32LE(0) !== 67324752) {
			throw new ApiError(ErrorCode.EINVAL, 'Invalid Zip file: Local file header has invalid signature: ' + this.data.readUInt32LE(0));
		}
	}
	public versionNeeded(): number {
		return this.data.readUInt16LE(4);
	}
	public flags(): number {
		return this.data.readUInt16LE(6);
	}
	public compressionMethod(): CompressionMethod {
		return this.data.readUInt16LE(8);
	}
	public lastModFileTime(): Date {
		// Time and date is in MS-DOS format.
		return msdos2date(this.data.readUInt16LE(10), this.data.readUInt16LE(12));
	}
	public rawLastModFileTime(): number {
		return this.data.readUInt32LE(10);
	}
	public crc32(): number {
		return this.data.readUInt32LE(14);
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
	// public compressedSize(): number { return this.data.readUInt32LE(18); }
	// public uncompressedSize(): number { return this.data.readUInt32LE(22); }
	public fileNameLength(): number {
		return this.data.readUInt16LE(26);
	}
	public extraFieldLength(): number {
		return this.data.readUInt16LE(28);
	}
	public fileName(): string {
		return safeToString(this.data, this.useUTF8(), 30, this.fileNameLength());
	}
	public extraField(): Buffer {
		const start = 30 + this.fileNameLength();
		return this.data.subarray(start, start + this.extraFieldLength());
	}
	public totalSize(): number {
		return 30 + this.fileNameLength() + this.extraFieldLength();
	}
	public useUTF8(): boolean {
		return (this.flags() & 2048) === 2048;
	}
}
