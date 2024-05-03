import { ApiError, ErrorCode } from '@zenfs/core/ApiError.js';
import { CompressionMethod, decompressionMethods } from '../compression.js';
import { CentralDirectory } from './CentralDirectory.js';
import { FileHeader } from './Header.js';

/**
 * 4.3.8  File data
 *
 *   Immediately following the local header for a file
 *   SHOULD be placed the compressed or stored data for the file.
 *   If the file is encrypted, the encryption header for the file
 *   SHOULD be placed after the local header and before the file
 *   data. The series of [local file header][encryption header]
 *   [file data][data descriptor] repeats for each file in the
 *   .ZIP archive.
 *
 *   Zero-byte files, directories, and other file types that
 *   contain no content MUST not include file data.
 */
export class Data {
	constructor(
		public readonly header: FileHeader,
		public readonly record: CentralDirectory,
		public readonly data: ArrayBufferLike
	) {}

	public decompress(): Uint8Array {
		// Check the compression
		const compressionMethod: CompressionMethod = this.header.compressionMethod;
		const decompress = decompressionMethods[compressionMethod];
		if (typeof decompress != 'function') {
			let name: string = CompressionMethod[compressionMethod];
			if (!name) {
				name = 'Unknown: ' + compressionMethod;
			}
			throw new ApiError(ErrorCode.EINVAL, `Invalid compression method on file '${this.header.name}': ${name}`);
		}
		return decompress(this.data, this.record.compressedSize, this.record.uncompressedSize, this.record.flag);
	}
}
