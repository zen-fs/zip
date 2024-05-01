import { ApiError, ErrorCode } from '@zenfs/core/ApiError.js';
import { safeToString } from '../utils.js';

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
	protected _view: DataView;
	constructor(protected data: ArrayBufferLike) {
		this._view = new DataView(data);
		if (this._view.getUint32(0, true) != 0x6054b50) {
			throw new ApiError(ErrorCode.EINVAL, 'Invalid Zip file: End of central directory record has invalid signature: 0x' + this._view.getUint32(0, true).toString(16));
		}
	}
	public get disk(): number {
		return this._view.getUint16(4, true);
	}
	public get cdDisk(): number {
		return this._view.getUint16(6, true);
	}
	public get cdDiskEntryCount(): number {
		return this._view.getUint16(8, true);
	}
	public get cdTotalEntryCount(): number {
		return this._view.getUint16(10, true);
	}
	public get cdSize(): number {
		return this._view.getUint32(12, true);
	}
	public get cdOffset(): number {
		return this._view.getUint32(16, true);
	}
	public get cdCommentLength(): number {
		return this._view.getUint16(20, true);
	}
	public get cdComment(): string {
		// Assuming UTF-8. The specification doesn't specify.
		return safeToString(this.data, true, 22, this.cdCommentLength);
	}
}
