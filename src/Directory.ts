import { DirectoryRecord, ISODirectoryRecord, JolietDirectoryRecord } from './DirectoryRecord.js';
import { FileFlags } from './constants.js';
import { CLEntry, REEntry } from './entries.js';

export abstract class Directory<T extends DirectoryRecord> {
	protected _record: T;
	private _fileList: string[] = [];
	private _fileMap: { [name: string]: T } = {};

	public constructor(record: T, isoData: Uint8Array) {
		this._record = record;
		let i = record.lba;
		let limit = i + record.dataLength;
		if (!(record.fileFlags & FileFlags.Directory)) {
			// Must have a CL entry.
			const cl = record.getSUEntries(isoData).filter(e => e instanceof CLEntry)[0] as CLEntry;
			i = cl.childDirectoryLba * 2048;
			limit = Infinity;
		}

		while (i < limit) {
			const len = isoData[i];
			// Zero-padding between sectors.
			// TODO: Could optimize this to seek to nearest-sector upon
			// seeing a 0.
			if (len === 0) {
				i++;
				continue;
			}
			const r = this._constructDirectoryRecord(isoData.slice(i));
			const fname = r.fileName(isoData);
			// Skip '.' and '..' entries.
			if (fname !== '\u0000' && fname !== '\u0001') {
				// Skip relocated entries.
				if (!r.hasRockRidge || r.getSUEntries(isoData).filter(e => e instanceof REEntry).length === 0) {
					this._fileMap[fname] = r;
					this._fileList.push(fname);
				}
			} else if (limit === Infinity) {
				// First entry contains needed data.
				limit = i + r.dataLength;
			}
			i += r.length;
		}
	}

	/**
	 * Get the record with the given name.
	 * Returns undefined if not present.
	 */
	public getRecord(name: string): DirectoryRecord {
		return this._fileMap[name];
	}

	public get fileList(): string[] {
		return this._fileList;
	}

	public getDotEntry(isoData: Uint8Array): T {
		return this._constructDirectoryRecord(isoData.slice(this._record.lba));
	}

	protected abstract _constructDirectoryRecord(data: Uint8Array): T;
}
export class ISODirectory extends Directory<ISODirectoryRecord> {
	public constructor(record: ISODirectoryRecord, isoData: Uint8Array) {
		super(record, isoData);
	}

	protected _constructDirectoryRecord(data: Uint8Array): ISODirectoryRecord {
		return new ISODirectoryRecord(data, this._record.rockRidgeOffset);
	}
}

export class JolietDirectory extends Directory<JolietDirectoryRecord> {
	public constructor(record: JolietDirectoryRecord, isoData: Uint8Array) {
		super(record, isoData);
	}

	protected _constructDirectoryRecord(data: Uint8Array): JolietDirectoryRecord {
		return new JolietDirectoryRecord(data, this._record.rockRidgeOffset);
	}
}
