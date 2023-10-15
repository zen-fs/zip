import { ApiError, ErrorCode } from '@browserfs/core/ApiError.js';
import { safeToString } from '../utils.js';
import { endOfCentralDirectoryMagic } from '../constants.js';

/**
 * 4.3.16: end of central directory record
 *  end of central dir signature    4 bytes  (0x06054b50)
 *  number of this disk             2 bytes
 *  number of the disk with the
 *  start of the central directory  2 bytes
 *  total number of entries in the
 *  central directory on this disk  2 bytes
 *  total number of entries in
 *  the central directory           2 bytes
 *  size of the central directory   4 bytes
 *  offset of start of central
 *  directory with respect to
 *  the starting disk number        4 bytes
 *  .ZIP file comment length        2 bytes
 *  .ZIP file comment       (variable size)
 */

export class EndOfCentralDirectory {
	constructor(private data: Buffer) {
		if (this.data.readUInt32LE(0) !== endOfCentralDirectoryMagic) {
			throw new ApiError(ErrorCode.EINVAL, `Invalid Zip file: End of central directory record has invalid signature: ${this.data.readUInt32LE(0)}`);
		}
	}
	public diskNumber(): number {
		return this.data.readUInt16LE(4);
	}
	public cdDiskNumber(): number {
		return this.data.readUInt16LE(6);
	}
	public cdDiskEntryCount(): number {
		return this.data.readUInt16LE(8);
	}
	public cdTotalEntryCount(): number {
		return this.data.readUInt16LE(10);
	}
	public cdSize(): number {
		return this.data.readUInt32LE(12);
	}
	public cdOffset(): number {
		return this.data.readUInt32LE(16);
	}
	public cdZipCommentLength(): number {
		return this.data.readUInt16LE(20);
	}
	public cdZipComment(): string {
		// Assuming UTF-8. The specification doesn't specify.
		return safeToString(this.data, true, 22, this.cdZipCommentLength());
	}
	public rawCdZipComment(): Buffer {
		return this.data.slice(22, 22 + this.cdZipCommentLength());
	}
}
