import { decode } from '@zenfs/core/utils.js';

export function getASCIIString(data: Uint8Array, startIndex: number, length: number) {
	return decode(data.slice(startIndex, startIndex + length));
}
export function getJolietString(data: Uint8Array, startIndex: number, length: number): string {
	if (length === 1) {
		// Special: Root, parent, current directory are still a single byte.
		return String.fromCharCode(data[startIndex]);
	}
	// UTF16-BE, which isn't natively supported by Uint8Arrays.
	// Length should be even, but pessimistically floor just in case.
	const pairs = Math.floor(length / 2);
	const chars = new Array(pairs);
	for (let i = 0; i < pairs; i++) {
		const pos = startIndex + (i << 1);
		chars[i] = String.fromCharCode(data[pos + 1] | (data[pos] << 8));
	}
	return chars.join('');
}
export function getDate(data: Uint8Array, startIndex: number): Date {
	const year = parseInt(getASCIIString(data, startIndex, 4), 10);
	const mon = parseInt(getASCIIString(data, startIndex + 4, 2), 10);
	const day = parseInt(getASCIIString(data, startIndex + 6, 2), 10);
	const hour = parseInt(getASCIIString(data, startIndex + 8, 2), 10);
	const min = parseInt(getASCIIString(data, startIndex + 10, 2), 10);
	const sec = parseInt(getASCIIString(data, startIndex + 12, 2), 10);
	const hundrethsSec = parseInt(getASCIIString(data, startIndex + 14, 2), 10);
	// Last is a time-zone offset, but JavaScript dates don't support time zones well.
	return new Date(year, mon, day, hour, min, sec, hundrethsSec * 100);
}
export type TGetString = (d: Uint8Array, i: number, len: number) => string;
export function getShortFormDate(data: Uint8Array, startIndex: number): Date {
	const yearsSince1900 = data[startIndex];
	const month = data[startIndex + 1];
	const day = data[startIndex + 2];
	const hour = data[startIndex + 3];
	const minute = data[startIndex + 4];
	const second = data[startIndex + 5];
	// JavaScript's Date support isn't so great; ignore timezone.
	// const offsetFromGMT = this._data[24];
	return new Date(yearsSince1900, month - 1, day, hour, minute, second);
}
