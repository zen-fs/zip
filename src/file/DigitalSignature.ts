import { ApiError, ErrorCode } from '@zenfs/core/ApiError.js';
import { deserialize, struct, types as t } from 'utilium';

/**
 * 4.3.13 Digital signature:
 *
 *      header signature                4 bytes  (0x05054b50)
 *      size of data                    2 bytes
 *      signature data (variable size)
 *
 *    With the introduction of the Central Directory Encryption
 *    feature in version 6.2 of this specification, the Central
 *    Directory Structure MAY be stored both compressed and encrypted.
 *    Although not required, it is assumed when encrypting the
 *    Central Directory Structure, that it will be compressed
 *    for greater storage efficiency.  Information on the
 *    Central Directory Encryption feature can be found in the section
 *    describing the Strong Encryption Specification. The Digital
 *    Signature record will be neither compressed nor encrypted.
 */

@struct()
export class DigitalSignature {
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
