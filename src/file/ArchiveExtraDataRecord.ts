import { ApiError, ErrorCode } from '@zenfs/core/ApiError.js';
import { deserialize, struct, types as t } from 'utilium';

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
