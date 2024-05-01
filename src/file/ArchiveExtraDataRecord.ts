import { ApiError, ErrorCode } from '@zenfs/core/ApiError.js';

/*
` 4.3.10  Archive decryption header:

	  4.3.10.1 The Archive Decryption Header is introduced in version 6.2
	  of the ZIP format specification.  This record exists in support
	  of the Central Directory Encryption Feature implemented as part of
	  the Strong Encryption Specification as described in this document.
	  When the Central Directory Structure is encrypted, this decryption
	  header MUST precede the encrypted data segment.
 */
/**
 * 4.3.11  Archive extra data record:
 *
 *      archive extra data signature    4 bytes  (0x08064b50)
 *      extra field length              4 bytes
 *      extra field data                (variable size)
 *
 *    4.3.11.1 The Archive Extra Data Record is introduced in version 6.2
 *    of the ZIP format specification.  This record MAY be used in support
 *    of the Central Directory Encryption Feature implemented as part of
 *    the Strong Encryption Specification as described in this document.
 *    When present, this record MUST immediately precede the central
 *    directory data structure.
 */

export class ArchiveExtraDataRecord {
	protected _view: DataView;
	constructor(public readonly data: ArrayBufferLike) {
		this._view = new DataView(data);
		if (this._view.getUint32(0, true) !== 134630224) {
			throw new ApiError(ErrorCode.EINVAL, 'Invalid archive extra data record signature: ' + this._view.getUint32(0, true));
		}
	}
	public get length(): number {
		return this._view.getUint32(4, true);
	}
	public get extraFieldData(): ArrayBuffer {
		return this.data.slice(8, 8 + this.length);
	}
}
