import { ApiError, ErrorCode } from '@browserfs/core/ApiError.js';
import { FileType, Stats } from '@browserfs/core/stats.js';
import { CompressionMethod } from '../compression.js';
import { msdos2date, safeToString } from '../utils.js';
import { Data } from './Data.js';
import { FileHeader } from './Header.js';

/**
 * 4.3.12  Central directory structure:
 *
 *  central file header signature   4 bytes  (0x02014b50)
 *  version made by                 2 bytes
 *  version needed to extract       2 bytes
 *  general purpose bit flag        2 bytes
 *  compression method              2 bytes
 *  last mod file time              2 bytes
 *  last mod file date              2 bytes
 *  crc-32                          4 bytes
 *  compressed size                 4 bytes
 *  uncompressed size               4 bytes
 *  file name length                2 bytes
 *  extra field length              2 bytes
 *  file comment length             2 bytes
 *  disk number start               2 bytes
 *  internal file attributes        2 bytes
 *  external file attributes        4 bytes
 *  relative offset of local header 4 bytes
 *
 *  file name (variable size)
 *  extra field (variable size)
 *  file comment (variable size)
 */

export class CentralDirectory {
	// Optimization: The filename is frequently read, so stash it here.
	private _filename: string;
	constructor(private zipData: Buffer, private data: Buffer) {
		// Sanity check.
		if (this.data.readUInt32LE(0) !== 33639248) {
			throw new ApiError(ErrorCode.EINVAL, `Invalid Zip file: Central directory record has invalid signature: ${this.data.readUInt32LE(0)}`);
		}
		this._filename = this.produceFilename();
	}
	public versionMadeBy(): number {
		return this.data.readUInt16LE(4);
	}
	public versionNeeded(): number {
		return this.data.readUInt16LE(6);
	}
	public flag(): number {
		return this.data.readUInt16LE(8);
	}
	public compressionMethod(): CompressionMethod {
		return this.data.readUInt16LE(10);
	}
	public lastModFileTime(): Date {
		// Time and date is in MS-DOS format.
		return msdos2date(this.data.readUInt16LE(12), this.data.readUInt16LE(14));
	}
	public rawLastModFileTime(): number {
		return this.data.readUInt32LE(12);
	}
	public crc32(): number {
		return this.data.readUInt32LE(16);
	}
	public compressedSize(): number {
		return this.data.readUInt32LE(20);
	}
	public uncompressedSize(): number {
		return this.data.readUInt32LE(24);
	}
	public fileNameLength(): number {
		return this.data.readUInt16LE(28);
	}
	public extraFieldLength(): number {
		return this.data.readUInt16LE(30);
	}
	public fileCommentLength(): number {
		return this.data.readUInt16LE(32);
	}
	public diskNumberStart(): number {
		return this.data.readUInt16LE(34);
	}
	public internalAttributes(): number {
		return this.data.readUInt16LE(36);
	}
	public externalAttributes(): number {
		return this.data.readUInt32LE(38);
	}
	public headerRelativeOffset(): number {
		return this.data.readUInt32LE(42);
	}
	public produceFilename(): string {
		/*
	  4.4.17.1 claims:
	  * All slashes are forward ('/') slashes.
	  * Filename doesn't begin with a slash.
	  * No drive letters or any nonsense like that.
	  * If filename is missing, the input came from standard input.

	  Unfortunately, this isn't true in practice. Some Windows zip utilities use
	  a backslash here, but the correct Unix-style path in file headers.

	  To avoid seeking all over the file to recover the known-good filenames
	  from file headers, we simply convert '/' to '\' here.
	*/
		const fileName: string = safeToString(this.data, this.useUTF8(), 46, this.fileNameLength());
		return fileName.replace(/\\/g, '/');
	}
	public fileName(): string {
		return this._filename;
	}
	public rawFileName(): Buffer {
		return this.data.subarray(46, 46 + this.fileNameLength());
	}
	public extraField(): Buffer {
		const start = 44 + this.fileNameLength();
		return this.data.subarray(start, start + this.extraFieldLength());
	}
	public fileComment(): string {
		const start = 46 + this.fileNameLength() + this.extraFieldLength();
		return safeToString(this.data, this.useUTF8(), start, this.fileCommentLength());
	}
	public rawFileComment(): Buffer {
		const start = 46 + this.fileNameLength() + this.extraFieldLength();
		return this.data.subarray(start, start + this.fileCommentLength());
	}
	public totalSize(): number {
		return 46 + this.fileNameLength() + this.extraFieldLength() + this.fileCommentLength();
	}
	public isDirectory(): boolean {
		// NOTE: This assumes that the zip file implementation uses the lower byte
		//       of external attributes for DOS attributes for
		//       backwards-compatibility. This is not mandated, but appears to be
		//       commonplace.
		//       According to the spec, the layout of external attributes is
		//       platform-dependent.
		//       If that fails, we also check if the name of the file ends in '/',
		//       which is what Java's ZipFile implementation does.
		const fileName = this.fileName();
		return (this.externalAttributes() & 16 ? true : false) || fileName.charAt(fileName.length - 1) === '/';
	}
	public isFile(): boolean {
		return !this.isDirectory();
	}
	public useUTF8(): boolean {
		return (this.flag() & 2048) === 2048;
	}
	public isEncrypted(): boolean {
		return (this.flag() & 1) === 1;
	}
	public getFileData(): Data {
		// Need to grab the header before we can figure out where the actual
		// compressed data starts.
		const start = this.headerRelativeOffset();
		const header = new FileHeader(this.zipData.subarray(start));
		return new Data(header, this, this.zipData.subarray(start + header.totalSize()));
	}
	public getData(): Buffer {
		return this.getFileData().decompress();
	}
	public getRawData(): Buffer {
		return this.getFileData().getRawData();
	}
	public getStats(): Stats {
		return new Stats(FileType.FILE, this.uncompressedSize(), 365, Date.now(), this.lastModFileTime().getTime());
	}
}
