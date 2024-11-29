/**
 * Converts the input `time` and `date` in MS-DOS format into a `Date`.
 *
 * MS-DOS format:
 * second			5 bits (2 second-precision)
 * minute			6 bits
 * hour				5 bits
 * day (1-31)		5 bits
 * month (1-23)		4 bits (MSDOS indexes with 1)
 * year (from 1980)	7 bits
 * @hidden
 */
export declare function msdosDate(datetime: number): Date;
/**
 * 8-bit ASCII with the extended character set. Unlike regular ASCII, we do not mask the high bits.
 * @see http://en.wikipedia.org/wiki/Extended_ASCII
 */
export declare const extendedASCIIChars: string[];
/**
 * Safely decodes the string from a buffer.
 * @hidden
 */
export declare function safeDecode(buffer: ArrayBufferLike | ArrayBufferView, utf8: boolean, start: number, length: number): string;
