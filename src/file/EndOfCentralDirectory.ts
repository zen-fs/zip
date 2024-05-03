import { ApiError, ErrorCode } from '@zenfs/core/ApiError.js';
import { safeToString } from '../utils.js';
import { deserialize, struct, types as t } from 'utilium';

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
