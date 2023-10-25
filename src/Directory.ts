import { DirectoryRecord, ISODirectoryRecord, JolietDirectoryRecord } from './DirectoryRecord.js';
import { FileFlags } from './constants.js';
import { CLEntry, REEntry } from './entries.js';

export abstract class Directory<T extends DirectoryRecord> {
	protected _record: T;
	private _fileList: string[] = [];
	private _fileMap: { [name: string]: T } = {};
	constructor(record: T, isoData: ArrayBuffer) {
		this._record = record;
		let i = record.lba();
		let iLimit = i + record.dataLength();
		if (!(record.fileFlags() & FileFlags.Directory)) {
			// Must have a CL entry.
			const cl = <CLEntry>record.getSUEntries(isoData).filter(e => e instanceof CLEntry)[0];
			i = cl.childDirectoryLba() * 2048;
			iLimit = Infinity;
		}

		while (i < iLimit) {
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
				if (!r.hasRockRidge() || r.getSUEntries(isoData).filter(e => e instanceof REEntry).length === 0) {
					this._fileMap[fname] = r;
					this._fileList.push(fname);
				}
			} else if (iLimit === Infinity) {
				// First entry contains needed data.
				iLimit = i + r.dataLength();
			}
			i += r.length();
		}
	}
	/**
	 * Get the record with the given name.
	 * Returns undefined if not present.
	 */
	public getRecord(name: string): DirectoryRecord {
		return this._fileMap[name];
	}
	public getFileList(): string[] {
		return this._fileList;
	}
	public getDotEntry(isoData: ArrayBuffer): T {
		return this._constructDirectoryRecord(isoData.slice(this._record.lba()));
	}
	protected abstract _constructDirectoryRecord(data: ArrayBuffer): T;
}
export class ISODirectory extends Directory<ISODirectoryRecord> {
	constructor(record: ISODirectoryRecord, isoData: ArrayBuffer) {
		super(record, isoData);
	}
	protected _constructDirectoryRecord(data: ArrayBuffer): ISODirectoryRecord {
		return new ISODirectoryRecord(data, this._record.getRockRidgeOffset());
	}
}

export class JolietDirectory extends Directory<JolietDirectoryRecord> {
	constructor(record: JolietDirectoryRecord, isoData: ArrayBuffer) {
		super(record, isoData);
	}
	protected _constructDirectoryRecord(data: ArrayBuffer): JolietDirectoryRecord {
		return new JolietDirectoryRecord(data, this._record.getRockRidgeOffset());
	}
}
