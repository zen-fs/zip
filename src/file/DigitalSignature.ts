import { ApiError, ErrorCode } from '@zenfs/core/ApiError.js';
import { deserialize, struct, types as t } from 'utilium';

/**
 * Digital signature
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.13
 */
export
@struct()
class DigitalSignature {
	constructor(protected data: ArrayBufferLike) {
		deserialize(this, data);
		if (this.signature != 0x5054b50) {
			throw new ApiError(ErrorCode.EINVAL, 'Invalid digital signature signature: ' + this.signature);
		}
	}

	@t.uint32 public signature: number;

	@t.uint16 public size: number;

	public get signatureData(): ArrayBuffer {
		return this.data.slice(6, 6 + this.size);
	}
}
