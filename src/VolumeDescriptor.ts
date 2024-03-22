import { ApiError, ErrorCode } from '@zenfs/core/index.js';
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
	public get type(): VolumeDescriptorTypeCode {
		return this._view[0];
	}
	public get standardIdentifier(): string {
		return getASCIIString(this._data, 1, 5);
	}
	public get version(): number {
		return this._view[6];
	}
	public get data(): ArrayBuffer {
		return this._data.slice(7, 2048);
	}
}

export abstract class PrimaryOrSupplementaryVolumeDescriptor extends VolumeDescriptor {
	private _root?: DirectoryRecord;
	constructor(data: ArrayBuffer) {
		super(data);
	}
	public get systemIdentifier(): string {
		return this._getString(8, 32);
	}
	public get volumeIdentifier(): string {
		return this._getString(40, 32);
	}
	public get volumeSpaceSize(): number {
		return this._view.getUint32(80, true);
	}
	public get volumeSetSize(): number {
		return this._view.getUint16(120, true);
	}
	public get volumeSequenceNumber(): number {
		return this._view.getUint16(124, true);
	}
	public get logicalBlockSize(): number {
		return this._view.getUint16(128, true);
	}
	public get pathTableSize(): number {
		return this._view.getUint32(132, true);
	}
	public get locationOfTypeLPathTable(): number {
		return this._view.getUint32(140, true);
	}
	public get locationOfOptionalTypeLPathTable(): number {
		return this._view.getUint32(144, true);
	}
	public get locationOfTypeMPathTable(): number {
		return this._view.getUint32(148);
	}
	public get locationOfOptionalTypeMPathTable(): number {
		return this._view.getUint32(152);
	}
	public rootDirectoryEntry(isoData: ArrayBuffer): DirectoryRecord {
		if (this._root) {
			return this._root;
		}
		this._root = this._constructRootDirectoryRecord(this._data.slice(156));
		this._root.rootCheckForRockRidge(isoData);
	}
	public get volumeSetIdentifier(): string {
		return this._getString(190, 128);
	}
	public get publisherIdentifier(): string {
		return this._getString(318, 128);
	}
	public get dataPreparerIdentifier(): string {
		return this._getString(446, 128);
	}
	public get applicationIdentifier(): string {
		return this._getString(574, 128);
	}
	public get copyrightFileIdentifier(): string {
		return this._getString(702, 38);
	}
	public get abstractFileIdentifier(): string {
		return this._getString(740, 36);
	}
	public get bibliographicFileIdentifier(): string {
		return this._getString(776, 37);
	}
	public get volumeCreationDate(): Date {
		return getDate(this._data, 813);
	}
	public get volumeModificationDate(): Date {
		return getDate(this._data, 830);
	}
	public get volumeExpirationDate(): Date {
		return getDate(this._data, 847);
	}
	public get volumeEffectiveDate(): Date {
		return getDate(this._data, 864);
	}
	public get fileStructureVersion(): number {
		return this._view[881];
	}
	public get applicationUsed(): ArrayBuffer {
		return this._data.slice(883, 883 + 512);
	}
	public get reserved(): ArrayBuffer {
		return this._data.slice(1395, 1395 + 653);
	}
	public abstract get name(): string;
	protected abstract _constructRootDirectoryRecord(data: ArrayBuffer): DirectoryRecord;
	protected abstract _getString(idx: number, len: number): string;
}

export class PrimaryVolumeDescriptor extends PrimaryOrSupplementaryVolumeDescriptor {
	constructor(data: ArrayBuffer) {
		super(data);
		if (this.type !== VolumeDescriptorTypeCode.PrimaryVolumeDescriptor) {
			throw new ApiError(ErrorCode.EIO, `Invalid primary volume descriptor.`);
		}
	}
	public get name() {
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
		if (this.type !== VolumeDescriptorTypeCode.SupplementaryVolumeDescriptor) {
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
	public get name() {
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
