import { extendedASCIIChars } from './constants.js';
import { decode } from '@zenfs/core/utils.js';

/**
 * Converts the input `time` and `date` in MS-DOS format into a `Date`.
 *
 * MS-DOS format:
 * second			5 bits
 * minute			6 bits
 * hour				5 bits
 * day (1-31)		5 bits
 * month (1-23)		4 bits
 * year (from 1980)	7 bits
 * @hidden
 */
export function msdos2date(time: number, date: number): Date {
	const day = date & 31;
	const month = ((date >> 5) & 15) - 1;
	const year = (date >> 9) + 1980;
	const second = time & 31;
	const minute = (time >> 5) & 63;
	const hour = time >> 11;
	return new Date(year, month, day, hour, minute, second);
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
