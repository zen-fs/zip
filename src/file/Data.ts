import { ApiError, ErrorCode } from '@zenfs/core/ApiError.js';
import { CompressionMethod, decompressionMethods } from '../compression.js';
import { CentralDirectory } from './CentralDirectory.js';
import { FileHeader } from './Header.js';

/**
 * File data
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.8
 */
export class Data {
	constructor(
		public readonly header: FileHeader,
		public readonly record: CentralDirectory,
		public readonly data: ArrayBufferLike
	) {}

	public decompress(): Uint8Array {
		// Check the compression
		const { compressionMethod } = this.header;
		const decompress = decompressionMethods[compressionMethod];
		if (typeof decompress != 'function') {
			const name: string = compressionMethod in CompressionMethod ? CompressionMethod[compressionMethod] : compressionMethod.toString();
			throw new ApiError(ErrorCode.EINVAL, `Invalid compression method on file '${this.header.name}': ${name}`);
		}
		return decompress(this.data, this.record.compressedSize, this.record.uncompressedSize, this.record.flag);
	}
}
