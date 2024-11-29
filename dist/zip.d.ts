import { Stats } from '@zenfs/core/stats.js';
import { CompressionMethod } from './compression.js';
/**
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.2.2
 */
export declare enum AttributeCompat {
    MSDOS = 0,
    AMIGA = 1,
    OPENVMS = 2,
    UNIX = 3,
    VM_CMS = 4,
    ATARI_ST = 5,
    OS2_HPFS = 6,
    MAC = 7,
    Z_SYSTEM = 8,
    CP_M = 9,
    NTFS = 10,
    MVS = 11,
    VSE = 12,
    ACORN_RISC = 13,
    VFAT = 14,
    ALT_MVS = 15,
    BEOS = 16,
    TANDEM = 17,
    OS_400 = 18,
    OSX = 19
}
/**
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.7
 */
export declare class LocalFileHeader {
    protected data: ArrayBufferLike;
    constructor(data: ArrayBufferLike);
    signature: number;
    /**
     * The minimum supported ZIP specification version needed to extract the file.
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.3
     */
    versionNeeded: number;
    /**
     * General purpose bit flags
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.4
     */
    flags: number;
    /**
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.5
     */
    compressionMethod: CompressionMethod;
    /**
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.6
     */
    protected datetime: number;
    /**
     * The date and time are encoded in standard MS-DOS format.
     * This getter decodes the date.
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.6
     */
    get lastModified(): Date;
    /**
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.7
     */
    crc32: number;
    /**
     * The size of the file compressed.
     * If bit 3 of the general purpose bit flag is set, set to zero.
     * central directory's entry is used
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.8
     */
    compressedSize: number;
    /**
     * The size of the file uncompressed
     * If bit 3 of the general purpose bit flag is set, set to zero.
     * central directory's entry is used
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.9
     */
    uncompressedSize: number;
    /**
     * The length of the file name
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.10
     */
    nameLength: number;
    /**
     * The length of the extra field
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.11
     */
    extraLength: number;
    /**
     * The name of the file, with optional relative path.
     * @see CentralDirectory.fileName
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.17
     */
    get name(): string;
    /**
     * This should be used for storage expansion.
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.28
     */
    get extra(): ArrayBuffer;
    get size(): number;
    get useUTF8(): boolean;
}
/**
 * Archive extra data record
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.11
 */
export declare class ExtraDataRecord {
    readonly data: ArrayBufferLike;
    signature: number;
    length: number;
    constructor(data: ArrayBufferLike);
    /**
     * This should be used for storage expansion.
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.28
     */
    get extraField(): ArrayBuffer;
}
/**
 * @hidden
 * Inlined for performance
 */
export declare const sizeof_FileEntry = 46;
/**
 * Refered to as a "central directory" record in the spec.
 * This is a file metadata entry inside the "central directory".
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.12
 */
export declare class FileEntry {
    protected zipData: ArrayBufferLike;
    protected _data: ArrayBufferLike;
    constructor(zipData: ArrayBufferLike, _data: ArrayBufferLike);
    signature: number;
    /**
     * The lower byte of "version made by", indicates the ZIP specification version supported by the software used to encode the file.
     * major — floor `zipVersion` / 10
     * minor — `zipVersion` mod 10
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.2
     */
    zipVersion: number;
    /**
     * The upper byte of "version made by", indicates the compatibility of the file attribute information.
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.2
     */
    attributeCompat: AttributeCompat;
    /**
     * The minimum supported ZIP specification version needed to extract the file.
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.3
     */
    versionNeeded: number;
    /**
     * General purpose bit flags
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.4
     */
    flag: number;
    get useUTF8(): boolean;
    get isEncrypted(): boolean;
    /**
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.5
     */
    compressionMethod: CompressionMethod;
    /**
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.6
     */
    protected datetime: number;
    /**
     * The date and time are encoded in standard MS-DOS format.
     * This getter decodes the date.
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.6
     */
    get lastModified(): Date;
    /**
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.7
     */
    crc32: number;
    /**
     * The size of the file compressed
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.8
     */
    compressedSize: number;
    /**
     * The size of the file uncompressed
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.9
     */
    uncompressedSize: number;
    /**
     * The length of the file name
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.10
     */
    nameLength: number;
    /**
     * The length of the extra field
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.11
     */
    extraLength: number;
    /**
     * The length of the comment
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.12
     */
    commentLength: number;
    /**
     * The number of the disk on which this file begins.
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.13
     */
    startDisk: number;
    /**
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.14
     */
    internalAttributes: number;
    /**
     * The mapping of the external attributes is host-system dependent.
     * For MS-DOS, the low order byte is the MS-DOS directory attribute byte.
     * If input came from standard input, this field is set to zero.
     * @see attributeCompat
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.15
     */
    externalAttributes: number;
    /**
     * This is the offset from the start of the first disk on which
     * this file appears to where the local header should be found.
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.16
     */
    headerRelativeOffset: number;
    /**
     * The name of the file, with optional relative path.
     * The filename is preloaded here, since looking it up is expensive.
     *
     * 4.4.17.1 claims:
     * - All slashes are forward ('/') slashes.
     * - Filename doesn't begin with a slash.
     * - No drive letters
     * - If filename is missing, the input came from standard input.
     *
     * Unfortunately, this isn't true in practice.
     * Some Windows zip utilities use a backslash here, but the correct Unix-style path in file headers.
     * To avoid seeking all over the file to recover the known-good filenames from file headers, we simply convert '/' to '\' here.
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.17
     */
    readonly name: string;
    /**
     * This should be used for storage expansion.
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.28
     */
    get extra(): ArrayBuffer;
    /**
     * The comment for this file
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.18
     */
    readonly comment: string;
    /**
     * The total size of the this entry
     */
    get size(): number;
    /**
     * Whether this entry is a directory
     */
    get isDirectory(): boolean;
    /**
     * Whether this entry is a file
     */
    get isFile(): boolean;
    /**
     * Gets the file data, and decompresses it if needed.
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.8
     */
    get data(): Uint8Array;
    get stats(): Stats;
}
/**
 * Digital signature
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.13
 */
export declare class DigitalSignature {
    protected data: ArrayBufferLike;
    constructor(data: ArrayBufferLike);
    signature: number;
    size: number;
    get signatureData(): ArrayBuffer;
}
/**
 * Overall ZIP file header.
 * Also call "end of central directory record"
 * Internally, ZIP files have only a single directory: the "central directory".
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.16
 */
export declare class Header {
    protected data: ArrayBufferLike;
    constructor(data: ArrayBufferLike);
    signature: number;
    /**
     * The number of this disk
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.19
     */
    disk: number;
    /**
     * The number of the disk with the start of the entries
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.20
     */
    entriesDisk: number;
    /**
     * Total number of entries on this disk
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.21
     */
    diskEntryCount: number;
    /**
     * Total number of entries
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.22
     */
    totalEntryCount: number;
    /**
     * Size of the "central directory"
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.23
     */
    size: number;
    /**
     * Offset of start of "central directory" with respect to the starting disk number
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.24
     */
    offset: number;
    /**
     * Comment length
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.25
     */
    commentLength: number;
    /**
     * Assuming the content is UTF-8 encoded. The specification doesn't specify.
     * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.26
     */
    get comment(): string;
}
