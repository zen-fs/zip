import { Deflate } from 'minizlib';

/**
 * 4.4.5
 */
export enum CompressionMethod {
	STORED = 0,
	SHRUNK = 1,
	REDUCED_1 = 2,
	REDUCED_2 = 3,
	REDUCED_3 = 4,
	REDUCED_4 = 5,
	IMPLODE = 6,
	DEFLATE = 8,
	DEFLATE64 = 9,
	TERSE_OLD = 10,
	BZIP2 = 12,
	LZMA = 14,
	TERSE_NEW = 18,
	LZ77 = 19,
	WAVPACK = 97,
	PPMD = 98,
}

export type decompress = (data: ArrayBufferLike, compressedSize: number, uncompressedSize: number, flags: number) => Uint8Array;

/**
 * Maps CompressionMethod to function that decompresses.
 */
export const decompressionMethods: { [method in CompressionMethod]?: decompress } = {
	[CompressionMethod.DEFLATE](data, end): Uint8Array {
		return new Deflate({}).end(data.slice(0, end)).read();
	},

	[CompressionMethod.STORED](data, compressedSize, uncompressedSize): Uint8Array {
		return new Uint8Array(data, 0, uncompressedSize);
	},
};
