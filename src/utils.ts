import { decode } from '@zenfs/core/utils.js';
import { deserialize, struct, types as t } from 'utilium';

export function getJolietString(data: Uint8Array): string {
	if (data.length === 1) {
		// Special: Root, parent, current directory are still a single byte.
		return String.fromCharCode(data[0]);
	}
	// UTF16-BE, which isn't natively supported by Uint8Arrays.
	// Length should be even, but pessimistically floor just in case.
	const pairs = Math.floor(data.length / 2);
	const chars = new Array(pairs);
	for (let i = 0; i < pairs; i++) {
		const pos = i << 1;
		chars[i] = String.fromCharCode(data[pos + 1] | (data[pos] << 8));
	}
	return chars.join('');
}

export function getDate(data: Uint8Array): Date {
	const year = parseInt(decode(data.slice(0, 4)));
	const month = parseInt(decode(data.slice(4, 6)));
	const day = parseInt(decode(data.slice(6, 8)));
	const hour = parseInt(decode(data.slice(8, 10)));
	const min = parseInt(decode(data.slice(10, 12)));
	const sec = parseInt(decode(data.slice(12, 14)));
	const hundrethsSec = parseInt(decode(data.slice(14, 16)));
	// Last is a time-zone offset, but JavaScript dates don't support time zones well.
	return new Date(year, month, day, hour, min, sec, hundrethsSec * 100);
}

@struct()
export class ShortFormDate {
	/**
	 * Years since 1990
	 * @todo This may not be the correct size
	 * @see https://wiki.osdev.org/ISO_9660
	 */
	@t.uint8 public year!: number;
	@t.uint8 public month!: number;
	@t.uint8 public day!: number;
	@t.uint8 public hour!: number;
	@t.uint8 public minute!: number;
	@t.uint8 public second!: number;

	/**
	 * Note: Timezone is ignored
	 */
	@t.uint8 public offsetFromGMT!: number;

	public get date(): Date {
		return new Date(this.year, this.month - 1, this.day, this.hour, this.minute, this.second);
	}
}

export function getShortFormDate(data: Uint8Array): Date {
	const date = new ShortFormDate();
	deserialize(date, data);
	return date.date;
}
