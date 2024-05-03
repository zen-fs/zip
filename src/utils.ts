import { extendedASCIIChars } from './constants.js';
import { decode } from '@zenfs/core/utils.js';

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
export function msdosDate(datetime: number): Date {
	return new Date(
		((datetime >> 25) & 127) + 1980, // year
		((datetime >> 21) & 15) - 1, // month
		(datetime >> 16) & 31, // day
		(datetime >> 11) & 31, // hour
		(datetime >> 5) & 63, // minute
		(datetime & 31) * 2 // second
	);
}

/**
 * Safely decodes the string from a buffer.
 * @hidden
 */
export function safeDecode(buffer: ArrayBufferLike | ArrayBufferView, utf8: boolean, start: number, length: number): string {
	if (length === 0) {
		return '';
	}

	const uintArray = new Uint8Array('buffer' in buffer ? buffer.buffer : buffer).slice(start, start + length);
	if (utf8) {
		return decode(uintArray);
	} else {
		return [...uintArray].map(char => (char > 127 ? extendedASCIIChars[char - 128] : String.fromCharCode(char))).join('');
	}
}
