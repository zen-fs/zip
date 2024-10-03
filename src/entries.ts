import { deserialize, struct, types as t, type Tuple } from 'utilium';
import { SLComponentRecord } from './SLComponentRecord.js';
import { getDate, getShortFormDate } from './utils.js';
import { decode } from '@zenfs/core';

export const enum EntrySignature {
	CE = 0x4345,
	PD = 0x5044,
	SP = 0x5350,
	ST = 0x5354,
	ER = 0x4552,
	ES = 0x4553,
	PX = 0x5058,
	PN = 0x504e,
	SL = 0x534c,
	NM = 0x4e4d,
	CL = 0x434c,
	PL = 0x504c,
	RE = 0x5245,
	TF = 0x5446,
	SF = 0x5346,
	RR = 0x5252,
}

/**
 * Note, GNU ISO is used for reference.
 * @see https://git.savannah.gnu.org/cgit/libcdio.git/tree/include/cdio/rock.h
 */

/**
 * Base system use entry
 */
export
@struct()
class SystemUseEntry {
	public constructor(protected data: Uint8Array) {
		deserialize(this, data);
	}

	@t.uint16 public signature!: EntrySignature;

	public get signatureString(): string {
		return decode(this.data.slice(0, 2));
	}

	@t.uint8 public length!: number;

	@t.uint8 public suVersion!: number;
}

/**
 * Continuation entry.
 */
export class CEEntry extends SystemUseEntry {
	protected _entries: SystemUseEntry[] = [];

	/**
	 * Logical block address of the continuation area.
	 */
	@t.uint64 public extent!: bigint;

	/**
	 * Offset into the logical block.
	 */
	@t.uint64 public offset!: bigint;

	/**
	 * Length of the continuation area.
	 */
	@t.uint64 public size!: bigint;

	public entries(data: Uint8Array): SystemUseEntry[] {
		this._entries ||= constructSystemUseEntries(data, Number(this.extent * 2048n + this.offset), this.size, data);
		return this._entries;
	}
}

/**
 * Padding entry.
 */
export class PDEntry extends SystemUseEntry {}

/**
 * Identifies that SUSP is in-use.
 */
export class SPEntry extends SystemUseEntry {
	@t.uint8(2) public magic!: Tuple<number, 2>;

	public checkMagic(): boolean {
		return this.magic[0] == 190 && this.magic[1] == 239;
	}

	@t.uint8 public skip!: number;
}

/**
 * Identifies the end of the SUSP entries.
 */
export class STEntry extends SystemUseEntry {}

/**
 * Specifies system-specific extensions to SUSP.
 */
export class EREntry extends SystemUseEntry {
	@t.uint8 public idLength!: number;

	@t.uint8 public descriptorLength!: number;

	@t.uint8 public sourceLength!: number;

	@t.uint8 public extensionVersion!: number;

	public get extensionIdentifier(): string {
		return decode(this.data.slice(8, 8 + this.idLength));
	}

	public get extensionDescriptor(): string {
		return decode(this.data.slice(8 + this.idLength, 8 + this.idLength + this.descriptorLength));
	}

	public get extensionSource(): string {
		const start = 8 + this.idLength + this.descriptorLength;
		return decode(this.data.slice(start, start + this.sourceLength));
	}
}

export class ESEntry extends SystemUseEntry {
	@t.uint8 public extensionSequence!: number;
}

/**
 * RockRidge: Marks that RockRidge is in use [deprecated]
 */

export class RREntry extends SystemUseEntry {}

/**
 * RockRidge: Records POSIX file attributes.
 */
export class PXEntry extends SystemUseEntry {
	@t.uint64 public mode!: bigint;

	@t.uint64 public nlinks!: bigint;

	@t.uint64 public uid!: bigint;

	@t.uint64 public gid!: bigint;

	@t.uint64 public inode!: bigint;
}

/**
 * RockRidge: Records POSIX device number.
 */
export class PNEntry extends SystemUseEntry {
	@t.uint64 public dev_high!: bigint;

	@t.uint64 public dev_low!: bigint;
}

/**
 * RockRidge: Records symbolic link
 */

export class SLEntry extends SystemUseEntry {
	@t.uint8 public flags!: number;

	public get continueFlag(): number {
		return this.flags & 1;
	}

	public get componentRecords(): SLComponentRecord[] {
		const records = [];
		let i = 5;
		while (i < this.length) {
			const record = new SLComponentRecord(this.data.slice(i));
			records.push(record);
			i += record.length;
		}
		return records;
	}
}

export function constructSystemUseEntry(_data: Uint8Array, i: number): SystemUseEntry {
	const data = _data.slice(i);
	const sue = new SystemUseEntry(data);
	switch (sue.signature) {
		case EntrySignature.CE:
			return new CEEntry(data);
		case EntrySignature.PD:
			return new PDEntry(data);
		case EntrySignature.SP:
			return new SPEntry(data);
		case EntrySignature.ST:
			return new STEntry(data);
		case EntrySignature.ER:
			return new EREntry(data);
		case EntrySignature.ES:
			return new ESEntry(data);
		case EntrySignature.PX:
			return new PXEntry(data);
		case EntrySignature.PN:
			return new PNEntry(data);
		case EntrySignature.SL:
			return new SLEntry(data);
		case EntrySignature.NM:
			return new NMEntry(data);
		case EntrySignature.CL:
			return new CLEntry(data);
		case EntrySignature.PL:
			return new PLEntry(data);
		case EntrySignature.RE:
			return new REEntry(data);
		case EntrySignature.TF:
			return new TFEntry(data);
		case EntrySignature.SF:
			return new SFEntry(data);
		case EntrySignature.RR:
			return new RREntry(data);
		default:
			return sue;
	}
}

export function constructSystemUseEntries(data: Uint8Array, i: number, len: bigint, isoData: Uint8Array): SystemUseEntry[] {
	// If the remaining allocated space following the last recorded System Use Entry in a System
	// Use field or Continuation Area is less than four bytes long, it cannot contain a System
	// Use Entry and shall be ignored
	len -= 4n;
	const entries: SystemUseEntry[] = [];
	while (i < len) {
		const entry = constructSystemUseEntry(data, i);
		const length = entry.length;
		if (!length) {
			// Invalid SU section; prevent infinite loop.
			return entries;
		}
		i += length;
		if (entry instanceof STEntry) {
			// ST indicates the end of entries.
			break;
		}
		if (entry instanceof CEEntry) {
			entries.push(...entry.entries(isoData));
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
	@t.uint8 public flags!: NMFlags;

	public name(getString: (data: Uint8Array) => string): string {
		return getString(this.data.slice(5, this.length));
	}
}

/**
 * RockRidge: Records child link
 */

export class CLEntry extends SystemUseEntry {
	@t.uint32 public childDirectoryLba!: number;
}

/**
 * RockRidge: Records parent link.
 */

export class PLEntry extends SystemUseEntry {
	@t.uint32 public parentDirectoryLba!: number;
}

/**
 * RockRidge: Records relocated directory.
 */

export class REEntry extends SystemUseEntry {}

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
	@t.uint8 public flags!: number;

	public get creation(): Date | undefined {
		if (!(this.flags & TFFlags.CREATION)) {
			return;
		}

		return this._longFormDates() ? getDate(this.data.slice(5)) : getShortFormDate(this.data.slice(5));
	}

	public get modify(): Date | undefined {
		if (!(this.flags & TFFlags.MODIFY)) {
			return;
		}
		const previousDates = this.flags & TFFlags.CREATION ? 1 : 0;
		return this._longFormDates() ? getDate(this.data.slice(5 + previousDates * 17)) : getShortFormDate(this.data.slice(5 + previousDates * 7));
	}

	public get access(): Date | undefined {
		if (!(this.flags & TFFlags.ACCESS)) {
			return;
		}
		let previousDates = this.flags & TFFlags.CREATION ? 1 : 0;
		previousDates += this.flags & TFFlags.MODIFY ? 1 : 0;
		return this._longFormDates() ? getDate(this.data.slice(5 + previousDates * 17)) : getShortFormDate(this.data.slice(5 + previousDates * 7));
	}

	public get backup(): Date | undefined {
		if (!(this.flags & TFFlags.BACKUP)) {
			return;
		}
		let previousDates = this.flags & TFFlags.CREATION ? 1 : 0;
		previousDates += this.flags & TFFlags.MODIFY ? 1 : 0;
		previousDates += this.flags & TFFlags.ACCESS ? 1 : 0;
		return this._longFormDates() ? getDate(this.data.slice(5 + previousDates * 17)) : getShortFormDate(this.data.slice(5 + previousDates * 7));
	}

	public get expiration(): Date | undefined {
		if (!(this.flags & TFFlags.EXPIRATION)) {
			return;
		}
		let previousDates = this.flags & TFFlags.CREATION ? 1 : 0;
		previousDates += this.flags & TFFlags.MODIFY ? 1 : 0;
		previousDates += this.flags & TFFlags.ACCESS ? 1 : 0;
		previousDates += this.flags & TFFlags.BACKUP ? 1 : 0;
		return this._longFormDates() ? getDate(this.data.slice(5 + previousDates * 17)) : getShortFormDate(this.data.slice(5 + previousDates * 7));
	}

	public get effective(): Date | undefined {
		if (!(this.flags & TFFlags.EFFECTIVE)) {
			return;
		}
		let previousDates = this.flags & TFFlags.CREATION ? 1 : 0;
		previousDates += this.flags & TFFlags.MODIFY ? 1 : 0;
		previousDates += this.flags & TFFlags.ACCESS ? 1 : 0;
		previousDates += this.flags & TFFlags.BACKUP ? 1 : 0;
		previousDates += this.flags & TFFlags.EXPIRATION ? 1 : 0;
		return this._longFormDates() ? getDate(this.data.slice(5 + previousDates * 17)) : getShortFormDate(this.data.slice(5 + previousDates * 7));
	}

	private _longFormDates(): boolean {
		return !!(this.flags && TFFlags.LONG_FORM);
	}
}

/**
 * RockRidge: File data in sparse format.
 */

export class SFEntry extends SystemUseEntry {
	@t.uint64 public virtualSizeHigh!: bigint;

	@t.uint64 public virtualSizeLow!: bigint;

	@t.uint8 public tableDepth!: number;
}
