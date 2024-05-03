import { ApiError, ErrorCode } from '@zenfs/core/ApiError.js';
import { safeToString } from '../utils.js';
import { deserialize, struct, types as t } from 'utilium';

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

@struct()
export class EndOfCentralDirectory {
	constructor(protected data: ArrayBufferLike) {
		deserialize(this, data);
		if (this.signature != 0x6054b50) {
			throw new ApiError(ErrorCode.EINVAL, 'Invalid Zip file: End of central directory record has invalid signature: 0x' + this.signature.toString(16));
		}
	}

	@t.uint32 public signature: number;

	@t.uint16 public disk: number;

	@t.uint16 public cdDisk: number;

	@t.uint16 public cdDiskEntryCount: number;

	@t.uint16 public cdTotalEntryCount: number;

	@t.uint32 public cdSize: number;

	@t.uint32 public cdOffset: number;

	@t.uint32 public cdCommentLength: number;

	public get cdComment(): string {
		// Assuming UTF-8. The specification doesn't specify.
		return safeToString(this.data, true, 22, this.cdCommentLength);
	}
}
