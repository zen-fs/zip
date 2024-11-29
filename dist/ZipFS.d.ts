import { NoSyncFile, Stats } from '@zenfs/core';
import { FileSystem, type FileSystemMetadata } from '@zenfs/core/filesystem.js';
import { FileEntry, Header } from './zip.js';
/**
 * Configuration options for a ZipFS file system.
 */
export interface ZipOptions {
    /**
     * The zip file as a binary buffer.
     */
    data: ArrayBufferLike;
    /**
     * The name of the zip file (optional).
     */
    name?: string;
    /**
     * Whether the file system should be case sensitive. (optional)
     * Defaults to true.
     */
    caseSensitive?: boolean;
}
declare const ZipFS_base: import("@zenfs/core").Mixin<import("@zenfs/core").Mixin<typeof FileSystem, import("utilium").ExtractProperties<FileSystem, (...args: any[]) => Promise<unknown>>>, {
    metadata(): FileSystemMetadata;
    rename(oldPath: string, newPath: string): Promise<void>;
    renameSync(oldPath: string, newPath: string): void;
    createFile(path: string, flag: string, mode: number): Promise<import("@zenfs/core").File>;
    createFileSync(path: string, flag: string, mode: number): import("@zenfs/core").File;
    unlink(path: string): Promise<void>;
    unlinkSync(path: string): void;
    rmdir(path: string): Promise<void>;
    rmdirSync(path: string): void;
    mkdir(path: string, mode: number): Promise<void>;
    mkdirSync(path: string, mode: number): void;
    link(srcpath: string, dstpath: string): Promise<void>;
    linkSync(srcpath: string, dstpath: string): void;
    sync(path: string, data: Uint8Array, stats: Readonly<Stats>): Promise<void>;
    syncSync(path: string, data: Uint8Array, stats: Readonly<Stats>): void;
}>;
/**
 * Zip file-backed filesystem
 * Implemented according to the standard:
 * http://pkware.com/documents/casestudies/APPNOTE.TXT
 *
 * While there are a few zip libraries for JavaScript (e.g. JSZip and zip.js),
 * they are not a good match for ZenFS. In particular, these libraries
 * perform a lot of unneeded data copying, and eagerly decompress every file
 * in the zip file upon loading to check the CRC32. They also eagerly decode
 * strings. Furthermore, these libraries duplicate functionality already present
 * in ZenFS (e.g. UTF-8 decoding and binary data manipulation).
 *
 * When the filesystem is instantiated, we determine the directory structure
 * of the zip file as quickly as possible. We lazily decompress and check the
 * CRC32 of files. We do not cache decompressed files; if this is a desired
 * feature, it is best implemented as a generic file system wrapper that can
 * cache data from arbitrary file systems.
 *
 * Current limitations:
 * * No encryption.
 * * No ZIP64 support.
 * * Read-only.
 *   Write support would require that we:
 *   - Keep track of changed/new files.
 *   - Compress changed files, and generate appropriate metadata for each.
 *   - Update file offsets for other files in the zip file.
 *   - Stream it out to a location.
 *   This isn't that bad, so we might do this at a later date.
 */
export declare class ZipFS extends ZipFS_base {
    readonly name: string;
    protected data: ArrayBufferLike;
    protected caseSensitive: boolean;
    protected files: Map<string, FileEntry>;
    protected names: Map<string, string>;
    protected directories: Map<string, Set<string>>;
    protected _time: number;
    /**
     * Locates the end of central directory record at the end of the file.
     * Throws an exception if it cannot be found.
     *
     * @remarks
     * Unfortunately, the comment is variable size and up to 64K in size.
     * We assume that the magic signature does not appear in the comment,
     * and in the bytes between the comment and the signature.
     * Other ZIP implementations make this same assumption,
     * since the alternative is to read thread every entry in the file.
     *
     * Offsets in this function are negative (i.e. from the end of the file).
     *
     * There is no byte alignment on the comment
     */
    protected static computeEOCD(data: ArrayBufferLike): Header;
    readonly eocd: Header;
    get endOfCentralDirectory(): Header;
    constructor(name: string, data: ArrayBufferLike, caseSensitive: boolean);
    metadata(): FileSystemMetadata;
    get numberOfCentralDirectoryEntries(): number;
    statSync(path: string): Stats;
    openFileSync(path: string, flag: string): NoSyncFile<this>;
    readdirSync(path: string): string[];
}
export declare const _Zip: {
    name: string;
    options: {
        data: {
            type: "object";
            required: true;
            description: string;
            validator(buff: unknown): void;
        };
        name: {
            type: "string";
            required: false;
            description: string;
        };
        caseSensitive: {
            type: "boolean";
            required: false;
            description: string;
        };
    };
    isAvailable(): boolean;
    create(options: ZipOptions): ZipFS;
};
type _Zip = typeof _Zip;
interface Zip extends _Zip {
}
export declare const Zip: Zip;
export {};
