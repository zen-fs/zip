import { SLComponentRecord } from './SLComponentRecord.js';
import { TGetString, getASCIIString, getDate, getShortFormDate } from './utils.js';

export const enum SystemUseEntrySignatures {
	CE = 17221,
	PD = 20548,
	SP = 21328,
	ST = 21332,
	ER = 17746,
	ES = 17747,
	PX = 20568,
	PN = 20558,
	SL = 21324,
	NM = 20045,
	CL = 17228,
	PL = 20556,
	RE = 21061,
	TF = 21574,
	SF = 21318,
	RR = 21074,
}

export class SystemUseEntry {
	protected _view: DataView;
	constructor(protected data: ArrayBuffer) {
		this._view = new DataView(data);
	}
	public signatureWord(): SystemUseEntrySignatures {
		return this._view.getUint16(0);
	}
	public signatureWordString(): string {
		return getASCIIString(this.data, 0, 2);
	}
	public length(): number {
		return this._view[2];
	}
	public suVersion(): number {
		return this._view[3];
	}
}
/**
 * Continuation entry.
 */

export class CEEntry extends SystemUseEntry {
	private _entries: SystemUseEntry[] | null = null;
	constructor(data: ArrayBuffer) {
		super(data);
	}
	/**
	 * Logical block address of the continuation area.
	 */
	public continuationLba(): number {
		return this._view.getUint32(4, true);
	}
	/**
	 * Offset into the logical block.
	 */
	public continuationLbaOffset(): number {
		return this._view.getUint32(12, true);
	}
	/**
	 * Length of the continuation area.
	 */
	public continuationLength(): number {
		return this._view.getUint32(20, true);
	}
	public getEntries(isoData: ArrayBuffer): SystemUseEntry[] {
		if (!this._entries) {
			const start = this.continuationLba() * 2048 + this.continuationLbaOffset();
			this._entries = constructSystemUseEntries(isoData, start, this.continuationLength(), isoData);
		}
		return this._entries;
	}
}

/**
 * Padding entry.
 */
export class PDEntry extends SystemUseEntry {
	constructor(data: ArrayBuffer) {
		super(data);
	}
}

/**
 * Identifies that SUSP is in-use.
 */

export class SPEntry extends SystemUseEntry {
	constructor(data: ArrayBuffer) {
		super(data);
	}
	public checkBytesPass(): boolean {
		return this._view[4] === 190 && this._view[5] === 239;
	}
	public bytesSkipped(): number {
		return this._view[6];
	}
}

/**
 * Identifies the end of the SUSP entries.
 */
export class STEntry extends SystemUseEntry {
	constructor(data: ArrayBuffer) {
		super(data);
	}
}

/**
 * Specifies system-specific extensions to SUSP.
 */

export class EREntry extends SystemUseEntry {
	constructor(data: ArrayBuffer) {
		super(data);
	}
	public identifierLength(): number {
		return this._view[4];
	}
	public descriptorLength(): number {
		return this._view[5];
	}
	public sourceLength(): number {
		return this._view[6];
	}
	public extensionVersion(): number {
		return this._view[7];
	}
	public extensionIdentifier(): string {
		return getASCIIString(this.data, 8, this.identifierLength());
	}
	public extensionDescriptor(): string {
		return getASCIIString(this.data, 8 + this.identifierLength(), this.descriptorLength());
	}
	public extensionSource(): string {
		return getASCIIString(this.data, 8 + this.identifierLength() + this.descriptorLength(), this.sourceLength());
	}
}

export class ESEntry extends SystemUseEntry {
	constructor(data: ArrayBuffer) {
		super(data);
	}
	public extensionSequence(): number {
		return this._view[4];
	}
}

/**
 * RockRidge: Marks that RockRidge is in use [deprecated]
 */

export class RREntry extends SystemUseEntry {
	constructor(data: ArrayBuffer) {
		super(data);
	}
}

/**
 * RockRidge: Records POSIX file attributes.
 */
export class PXEntry extends SystemUseEntry {
	constructor(data: ArrayBuffer) {
		super(data);
	}
	public mode(): number {
		return this._view.getUint32(4, true);
	}
	public fileLinks(): number {
		return this._view.getUint32(12, true);
	}
	public uid(): number {
		return this._view.getUint32(20, true);
	}
	public gid(): number {
		return this._view.getUint32(28, true);
	}
	public inode(): number {
		return this._view.getUint32(36, true);
	}
}

/**
 * RockRidge: Records POSIX device number.
 */
export class PNEntry extends SystemUseEntry {
	constructor(data: ArrayBuffer) {
		super(data);
	}
	public devTHigh(): number {
		return this._view.getUint32(4, true);
	}
	public devTLow(): number {
		return this._view.getUint32(12, true);
	}
}

/**
 * RockRidge: Records symbolic link
 */

export class SLEntry extends SystemUseEntry {
	constructor(data: ArrayBuffer) {
		super(data);
	}
	public get flags(): number {
		return this._view[4];
	}
	public get continueFlag(): number {
		return this.flags & 1;
	}
	public get componentRecords(): SLComponentRecord[] {
		const records = new Array<SLComponentRecord>();
		let i = 5;
		while (i < this.length()) {
			const record = new SLComponentRecord(this.data.slice(i));
			records.push(record);
			i += record.length;
		}
		return records;
	}
}

export function constructSystemUseEntry(bigData: ArrayBuffer, i: number): SystemUseEntry {
	const data = bigData.slice(i);
	const sue = new SystemUseEntry(data);
	switch (sue.signatureWord()) {
		case SystemUseEntrySignatures.CE:
			return new CEEntry(data);
		case SystemUseEntrySignatures.PD:
			return new PDEntry(data);
		case SystemUseEntrySignatures.SP:
			return new SPEntry(data);
		case SystemUseEntrySignatures.ST:
			return new STEntry(data);
		case SystemUseEntrySignatures.ER:
			return new EREntry(data);
		case SystemUseEntrySignatures.ES:
			return new ESEntry(data);
		case SystemUseEntrySignatures.PX:
			return new PXEntry(data);
		case SystemUseEntrySignatures.PN:
			return new PNEntry(data);
		case SystemUseEntrySignatures.SL:
			return new SLEntry(data);
		case SystemUseEntrySignatures.NM:
			return new NMEntry(data);
		case SystemUseEntrySignatures.CL:
			return new CLEntry(data);
		case SystemUseEntrySignatures.PL:
			return new PLEntry(data);
		case SystemUseEntrySignatures.RE:
			return new REEntry(data);
		case SystemUseEntrySignatures.TF:
			return new TFEntry(data);
		case SystemUseEntrySignatures.SF:
			return new SFEntry(data);
		case SystemUseEntrySignatures.RR:
			return new RREntry(data);
		default:
			return sue;
	}
}

export function constructSystemUseEntries(data: ArrayBuffer, i: number, len: number, isoData: ArrayBuffer): SystemUseEntry[] {
	// If the remaining allocated space following the last recorded System Use Entry in a System
	// Use field or Continuation Area is less than four bytes long, it cannot contain a System
	// Use Entry and shall be ignored
	len = len - 4;
	let entries = new Array<SystemUseEntry>();
	while (i < len) {
		const entry = constructSystemUseEntry(data, i);
		const length = entry.length();
		if (length === 0) {
			// Invalid SU section; prevent infinite loop.
			return entries;
		}
		i += length;
		if (entry instanceof STEntry) {
			// ST indicates the end of entries.
			break;
		}
		if (entry instanceof CEEntry) {
			entries = entries.concat(entry.getEntries(isoData));
		} else {
			entries.push(entry);
		}
	}
	return entries;
}

export const enum NMFlags {
	CONTINUE = 1,
	CURRENT = 1 << 1,
	PARENT = 1 << 2,
}

/**
 * RockRidge: Records alternate file name
 */

export class NMEntry extends SystemUseEntry {
	constructor(data: ArrayBuffer) {
		super(data);
	}
	public flags(): NMFlags {
		return this._view[4];
	}
	public name(getString: TGetString): string {
		return getString(this.data, 5, this.length() - 5);
	}
}

/**
 * RockRidge: Records child link
 */

export class CLEntry extends SystemUseEntry {
	constructor(data: ArrayBuffer) {
		super(data);
	}
	public childDirectoryLba(): number {
		return this._view.getUint32(4, true);
	}
}

/**
 * RockRidge: Records parent link.
 */

export class PLEntry extends SystemUseEntry {
	constructor(data: ArrayBuffer) {
		super(data);
	}
	public parentDirectoryLba(): number {
		return this._view.getUint32(4, true);
	}
}

/**
 * RockRidge: Records relocated directory.
 */

export class REEntry extends SystemUseEntry {
	constructor(data: ArrayBuffer) {
		super(data);
	}
}

export const enum TFFlags {
	CREATION = 1,
	MODIFY = 1 << 1,
	ACCESS = 1 << 2,
	ATTRIBUTES = 1 << 3,
	BACKUP = 1 << 4,
	EXPIRATION = 1 << 5,
	EFFECTIVE = 1 << 6,
	LONG_FORM = 1 << 7,
}
/**
 * RockRidge: Records file timestamps
 */

export class TFEntry extends SystemUseEntry {
	constructor(data: ArrayBuffer) {
		super(data);
	}
	public flags(): number {
		return this._view[4];
	}
	public creation(): Date | null {
		if (this.flags() & TFFlags.CREATION) {
			if (this._longFormDates()) {
				return getDate(this.data, 5);
			} else {
				return getShortFormDate(this.data, 5);
			}
		} else {
			return null;
		}
	}
	public modify(): Date | null {
		if (this.flags() & TFFlags.MODIFY) {
			const previousDates = this.flags() & TFFlags.CREATION ? 1 : 0;
			if (this._longFormDates()) {
				return getDate(this.data, 5 + previousDates * 17);
			} else {
				return getShortFormDate(this.data, 5 + previousDates * 7);
			}
		} else {
			return null;
		}
	}
	public access(): Date | null {
		if (this.flags() & TFFlags.ACCESS) {
			let previousDates = this.flags() & TFFlags.CREATION ? 1 : 0;
			previousDates += this.flags() & TFFlags.MODIFY ? 1 : 0;
			if (this._longFormDates()) {
				return getDate(this.data, 5 + previousDates * 17);
			} else {
				return getShortFormDate(this.data, 5 + previousDates * 7);
			}
		} else {
			return null;
		}
	}
	public backup(): Date | null {
		if (this.flags() & TFFlags.BACKUP) {
			let previousDates = this.flags() & TFFlags.CREATION ? 1 : 0;
			previousDates += this.flags() & TFFlags.MODIFY ? 1 : 0;
			previousDates += this.flags() & TFFlags.ACCESS ? 1 : 0;
			if (this._longFormDates()) {
				return getDate(this.data, 5 + previousDates * 17);
			} else {
				return getShortFormDate(this.data, 5 + previousDates * 7);
			}
		} else {
			return null;
		}
	}
	public expiration(): Date | null {
		if (this.flags() & TFFlags.EXPIRATION) {
			let previousDates = this.flags() & TFFlags.CREATION ? 1 : 0;
			previousDates += this.flags() & TFFlags.MODIFY ? 1 : 0;
			previousDates += this.flags() & TFFlags.ACCESS ? 1 : 0;
			previousDates += this.flags() & TFFlags.BACKUP ? 1 : 0;
			if (this._longFormDates()) {
				return getDate(this.data, 5 + previousDates * 17);
			} else {
				return getShortFormDate(this.data, 5 + previousDates * 7);
			}
		} else {
			return null;
		}
	}
	public effective(): Date | null {
		if (this.flags() & TFFlags.EFFECTIVE) {
			let previousDates = this.flags() & TFFlags.CREATION ? 1 : 0;
			previousDates += this.flags() & TFFlags.MODIFY ? 1 : 0;
			previousDates += this.flags() & TFFlags.ACCESS ? 1 : 0;
			previousDates += this.flags() & TFFlags.BACKUP ? 1 : 0;
			previousDates += this.flags() & TFFlags.EXPIRATION ? 1 : 0;
			if (this._longFormDates()) {
				return getDate(this.data, 5 + previousDates * 17);
			} else {
				return getShortFormDate(this.data, 5 + previousDates * 7);
			}
		} else {
			return null;
		}
	}
	private _longFormDates(): boolean {
		return !!(this.flags() && TFFlags.LONG_FORM);
	}
}

/**
 * RockRidge: File data in sparse format.
 */

export class SFEntry extends SystemUseEntry {
	constructor(data: ArrayBuffer) {
		super(data);
	}
	public virtualSizeHigh(): number {
		return this._view.getUint32(4, true);
	}
	public virtualSizeLow(): number {
		return this._view.getUint32(12, true);
	}
	public tableDepth(): number {
		return this._view[20];
	}
}
