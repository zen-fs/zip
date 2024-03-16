import { TGetString } from './utils.js';

export const enum SLComponentFlags {
	CONTINUE = 1,
	CURRENT = 1 << 1,
	PARENT = 1 << 2,
	ROOT = 1 << 3,
}

export class SLComponentRecord {
	constructor(protected data: ArrayBuffer) {}
	public get flags(): SLComponentFlags {
		return this.data[0];
	}
	public get length(): number {
		return 2 + this.componentLength;
	}
	public get componentLength(): number {
		return this.data[1];
	}
	public content(getString: TGetString): string {
		return getString(this.data, 2, this.componentLength);
	}
}
