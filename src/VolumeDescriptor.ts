import { ApiError, ErrorCode } from '@browserfs/core/index.js';
import { DirectoryRecord, ISODirectoryRecord, JolietDirectoryRecord } from './DirectoryRecord.js';
import { getASCIIString, getDate, getJolietString } from './utils.js';

export const enum VolumeDescriptorTypeCode {
	BootRecord = 0,
	PrimaryVolumeDescriptor = 1,
	SupplementaryVolumeDescriptor = 2,
	VolumePartitionDescriptor = 3,
	VolumeDescriptorSetTerminator = 255,
}

export class VolumeDescriptor {
	protected _view: DataView;
	constructor(protected _data: ArrayBuffer) {
		this._view = new DataView(_data);
	}
	public type(): VolumeDescriptorTypeCode {
		return this._view[0];
	}
	public standardIdentifier(): string {
		return getASCIIString(this._data, 1, 5);
	}
	public version(): number {
		return this._view[6];
	}
	public data(): ArrayBuffer {
		return this._data.slice(7, 2048);
	}
}

export abstract class PrimaryOrSupplementaryVolumeDescriptor extends VolumeDescriptor {
	private _root: DirectoryRecord | null = null;
	constructor(data: ArrayBuffer) {
		super(data);
	}
	public systemIdentifier(): string {
		return this._getString32(8);
	}
	public volumeIdentifier(): string {
		return this._getString32(40);
	}
	public volumeSpaceSize(): number {
		return this._view.getUint32(80, true);
	}
	public volumeSetSize(): number {
		return this._view.getUint16(120, true);
	}
	public volumeSequenceNumber(): number {
		return this._view.getUint16(124, true);
	}
	public logicalBlockSize(): number {
		return this._view.getUint16(128, true);
	}
	public pathTableSize(): number {
		return this._view.getUint32(132, true);
	}
	public locationOfTypeLPathTable(): number {
		return this._view.getUint32(140, true);
	}
	public locationOfOptionalTypeLPathTable(): number {
		return this._view.getUint32(144, true);
	}
	public locationOfTypeMPathTable(): number {
		return this._view.getUint32(148);
	}
	public locationOfOptionalTypeMPathTable(): number {
		return this._view.getUint32(152);
	}
	public rootDirectoryEntry(isoData: ArrayBuffer): DirectoryRecord {
		if (this._root === null) {
			this._root = this._constructRootDirectoryRecord(this._data.slice(156));
			this._root.rootCheckForRockRidge(isoData);
		}
		return this._root;
	}
	public volumeSetIdentifier(): string {
		return this._getString(190, 128);
	}
	public publisherIdentifier(): string {
		return this._getString(318, 128);
	}
	public dataPreparerIdentifier(): string {
		return this._getString(446, 128);
	}
	public applicationIdentifier(): string {
		return this._getString(574, 128);
	}
	public copyrightFileIdentifier(): string {
		return this._getString(702, 38);
	}
	public abstractFileIdentifier(): string {
		return this._getString(740, 36);
	}
	public bibliographicFileIdentifier(): string {
		return this._getString(776, 37);
	}
	public volumeCreationDate(): Date {
		return getDate(this._data, 813);
	}
	public volumeModificationDate(): Date {
		return getDate(this._data, 830);
	}
	public volumeExpirationDate(): Date {
		return getDate(this._data, 847);
	}
	public volumeEffectiveDate(): Date {
		return getDate(this._data, 864);
	}
	public fileStructureVersion(): number {
		return this._view[881];
	}
	public applicationUsed(): ArrayBuffer {
		return this._data.slice(883, 883 + 512);
	}
	public reserved(): ArrayBuffer {
		return this._data.slice(1395, 1395 + 653);
	}
	public abstract name(): string;
	protected abstract _constructRootDirectoryRecord(data: ArrayBuffer): DirectoryRecord;
	protected abstract _getString(idx: number, len: number): string;
	protected _getString32(idx: number): string {
		return this._getString(idx, 32);
	}
}

export class PrimaryVolumeDescriptor extends PrimaryOrSupplementaryVolumeDescriptor {
	constructor(data: ArrayBuffer) {
		super(data);
		if (this.type() !== VolumeDescriptorTypeCode.PrimaryVolumeDescriptor) {
			throw new ApiError(ErrorCode.EIO, `Invalid primary volume descriptor.`);
		}
	}
	public name() {
		return 'ISO9660';
	}
	protected _constructRootDirectoryRecord(data: ArrayBuffer): DirectoryRecord {
		return new ISODirectoryRecord(data, -1);
	}
	protected _getString(idx: number, len: number): string {
		return this._getString(idx, len);
	}
}

export class SupplementaryVolumeDescriptor extends PrimaryOrSupplementaryVolumeDescriptor {
	constructor(data: ArrayBuffer) {
		super(data);
		if (this.type() !== VolumeDescriptorTypeCode.SupplementaryVolumeDescriptor) {
			throw new ApiError(ErrorCode.EIO, `Invalid supplementary volume descriptor.`);
		}
		const escapeSequence = this.escapeSequence();
		const third = escapeSequence[2];
		// Third character identifies what 'level' of the UCS specification to follow.
		// We ignore it.
		if (escapeSequence[0] !== 37 || escapeSequence[1] !== 47 || (third !== 64 && third !== 67 && third !== 69)) {
			throw new ApiError(ErrorCode.EIO, `Unrecognized escape sequence for SupplementaryVolumeDescriptor: ${escapeSequence.toString()}`);
		}
	}
	public name() {
		return 'Joliet';
	}
	public escapeSequence(): ArrayBuffer {
		return this._data.slice(88, 120);
	}
	protected _constructRootDirectoryRecord(data: ArrayBuffer): DirectoryRecord {
		return new JolietDirectoryRecord(data, -1);
	}
	protected _getString(idx: number, len: number): string {
		return getJolietString(this._data, idx, len);
	}
}
