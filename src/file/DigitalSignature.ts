import { ApiError, ErrorCode } from '@browserfs/core/ApiError.js';

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

export class DigitalSignature {
	constructor(private data: Buffer) {
		if (this.data.readUInt32LE(0) !== 84233040) {
			throw new ApiError(ErrorCode.EINVAL, 'Invalid digital signature signature: ' + this.data.readUInt32LE(0));
		}
	}
	public size(): number {
		return this.data.readUInt16LE(4);
	}
	public signatureData(): Buffer {
		return this.data.subarray(6, 6 + this.size());
	}
}
