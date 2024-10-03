import { DirectoryRecord, ISODirectoryRecord, JolietDirectoryRecord } from './DirectoryRecord.js';
import { FileFlags } from './constants.js';
import { CLEntry, REEntry } from './entries.js';

export abstract class Directory<T extends DirectoryRecord> extends Map<string, T> {
	//public readonly files: string[] = [];
	//private fileMap = new Map<string, T>();

	public constructor(
		protected record: T,
		isoData: Uint8Array
	) {
		super();
		let i = record.lba;
		let limit = i + record.dataLength;
		if (!(record.fileFlags & FileFlags.Directory)) {
			// Must have a CL entry.
			const cl = record.getSUEntries(isoData).find(e => e instanceof CLEntry);
			if (!cl) {
				throw new ReferenceError('No CL entry');
			}
			i = cl.childDirectoryLba * 2048;
			limit = Infinity;
		}

		while (i < limit) {
			const length = isoData[i];
			// Zero-padding between sectors.
			// Could optimize this to seek to nearest-sector upon seeing a 0.
			if (!length) {
				i++;
				continue;
			}
			const r = this._constructDirectoryRecord(isoData.slice(i));
			const fname = r.fileName(isoData);
			// Skip '.' and '..' entries.
			if (fname !== '\u0000' && fname !== '\u0001' && (!r.hasRockRidge || !r.getSUEntries(isoData).filter(e => e instanceof REEntry).length)) {
				this.set(fname, r);
			} else if (limit === Infinity) {
				// First entry contains needed data.
				limit = i + r.dataLength;
			}
			i += r.length;
		}
	}

	public getDotEntry(isoData: Uint8Array): T {
		return this._constructDirectoryRecord(isoData.slice(this.record.lba));
	}

	protected abstract _constructDirectoryRecord(data: Uint8Array): T;
}

export class ISODirectory extends Directory<ISODirectoryRecord> {
	protected _constructDirectoryRecord(data: Uint8Array): ISODirectoryRecord {
		return new ISODirectoryRecord(data, this.record.rockRidgeOffset);
	}
}

export class JolietDirectory extends Directory<JolietDirectoryRecord> {
	protected _constructDirectoryRecord(data: Uint8Array): JolietDirectoryRecord {
		return new JolietDirectoryRecord(data, this.record.rockRidgeOffset);
	}
}
