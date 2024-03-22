import { extendedASCIIChars } from './constants.js';
import { decode } from '@zenfs/core/utils.js';

/**
 * Converts the input time and date in MS-DOS format into a JavaScript Date
 * object.
 * @hidden
 */
export function msdos2date(time: number, date: number): Date {
	// MS-DOS Date
	// |0 0 0 0  0|0 0 0  0|0 0 0  0 0 0 0
	//   D (1-31)  M (1-23)  Y (from 1980)
	const day = date & 31;
	// JS date is 0-indexed, DOS is 1-indexed.
	const month = ((date >> 5) & 15) - 1;
	const year = (date >> 9) + 1980;
	// MS DOS Time
	// |0 0 0 0  0|0 0 0  0 0 0|0  0 0 0 0
	//    Second      Minute       Hour
	const second = time & 31;
	const minute = (time >> 5) & 63;
	const hour = time >> 11;
	return new Date(year, month, day, hour, minute, second);
}
/**
 * Safely returns the string from the buffer, even if it is 0 bytes long.
 * (Normally, calling toString() on a buffer with start === end causes an
 * exception).
 * @hidden
 */
export function safeToString(buff: ArrayBufferLike | ArrayBufferView, useUTF8: boolean, start: number, length: number): string {
	if (length === 0) {
		return '';
	}

	const uintArray = new Uint8Array('buffer' in buff ? buff.buffer : buff);
	if (useUTF8) {
		return decode(uintArray.slice(start, start + length));
	} else {
		return [...uintArray].map(char => (char > 127 ? extendedASCIIChars[char - 128] : String.fromCharCode(char))).join();
	}
}
