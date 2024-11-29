var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { S_IFDIR, S_IFREG } from '@zenfs/core/emulation/constants.js';
import { Errno, ErrnoError } from '@zenfs/core/error.js';
import { Stats } from '@zenfs/core/stats.js';
import { deserialize, sizeof, struct, types as t } from 'utilium';
import { CompressionMethod, decompressionMethods } from './compression.js';
import { msdosDate, safeDecode } from './utils.js';
/**
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.2.2
 */
export var AttributeCompat;
(function (AttributeCompat) {
    AttributeCompat[AttributeCompat["MSDOS"] = 0] = "MSDOS";
    AttributeCompat[AttributeCompat["AMIGA"] = 1] = "AMIGA";
    AttributeCompat[AttributeCompat["OPENVMS"] = 2] = "OPENVMS";
    AttributeCompat[AttributeCompat["UNIX"] = 3] = "UNIX";
    AttributeCompat[AttributeCompat["VM_CMS"] = 4] = "VM_CMS";
    AttributeCompat[AttributeCompat["ATARI_ST"] = 5] = "ATARI_ST";
    AttributeCompat[AttributeCompat["OS2_HPFS"] = 6] = "OS2_HPFS";
    AttributeCompat[AttributeCompat["MAC"] = 7] = "MAC";
    AttributeCompat[AttributeCompat["Z_SYSTEM"] = 8] = "Z_SYSTEM";
    AttributeCompat[AttributeCompat["CP_M"] = 9] = "CP_M";
    AttributeCompat[AttributeCompat["NTFS"] = 10] = "NTFS";
    AttributeCompat[AttributeCompat["MVS"] = 11] = "MVS";
    AttributeCompat[AttributeCompat["VSE"] = 12] = "VSE";
    AttributeCompat[AttributeCompat["ACORN_RISC"] = 13] = "ACORN_RISC";
    AttributeCompat[AttributeCompat["VFAT"] = 14] = "VFAT";
    AttributeCompat[AttributeCompat["ALT_MVS"] = 15] = "ALT_MVS";
    AttributeCompat[AttributeCompat["BEOS"] = 16] = "BEOS";
    AttributeCompat[AttributeCompat["TANDEM"] = 17] = "TANDEM";
    AttributeCompat[AttributeCompat["OS_400"] = 18] = "OS_400";
    AttributeCompat[AttributeCompat["OSX"] = 19] = "OSX";
})(AttributeCompat || (AttributeCompat = {}));
/**
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.7
 */
let LocalFileHeader = (() => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    let _classDecorators = [struct()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _signature_decorators;
    let _signature_initializers = [];
    let _signature_extraInitializers = [];
    let _versionNeeded_decorators;
    let _versionNeeded_initializers = [];
    let _versionNeeded_extraInitializers = [];
    let _flags_decorators;
    let _flags_initializers = [];
    let _flags_extraInitializers = [];
    let _compressionMethod_decorators;
    let _compressionMethod_initializers = [];
    let _compressionMethod_extraInitializers = [];
    let _datetime_decorators;
    let _datetime_initializers = [];
    let _datetime_extraInitializers = [];
    let _crc32_decorators;
    let _crc32_initializers = [];
    let _crc32_extraInitializers = [];
    let _compressedSize_decorators;
    let _compressedSize_initializers = [];
    let _compressedSize_extraInitializers = [];
    let _uncompressedSize_decorators;
    let _uncompressedSize_initializers = [];
    let _uncompressedSize_extraInitializers = [];
    let _nameLength_decorators;
    let _nameLength_initializers = [];
    let _nameLength_extraInitializers = [];
    let _extraLength_decorators;
    let _extraLength_initializers = [];
    let _extraLength_extraInitializers = [];
    var LocalFileHeader = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _signature_decorators = [(_a = t).uint32.bind(_a)];
            _versionNeeded_decorators = [(_b = t).uint16.bind(_b)];
            _flags_decorators = [(_c = t).uint16.bind(_c)];
            _compressionMethod_decorators = [(_d = t).uint16.bind(_d)];
            _datetime_decorators = [(_e = t).uint32.bind(_e)];
            _crc32_decorators = [(_f = t).uint32.bind(_f)];
            _compressedSize_decorators = [(_g = t).uint32.bind(_g)];
            _uncompressedSize_decorators = [(_h = t).uint32.bind(_h)];
            _nameLength_decorators = [(_j = t).uint16.bind(_j)];
            _extraLength_decorators = [(_k = t).uint16.bind(_k)];
            __esDecorate(null, null, _signature_decorators, { kind: "field", name: "signature", static: false, private: false, access: { has: obj => "signature" in obj, get: obj => obj.signature, set: (obj, value) => { obj.signature = value; } }, metadata: _metadata }, _signature_initializers, _signature_extraInitializers);
            __esDecorate(null, null, _versionNeeded_decorators, { kind: "field", name: "versionNeeded", static: false, private: false, access: { has: obj => "versionNeeded" in obj, get: obj => obj.versionNeeded, set: (obj, value) => { obj.versionNeeded = value; } }, metadata: _metadata }, _versionNeeded_initializers, _versionNeeded_extraInitializers);
            __esDecorate(null, null, _flags_decorators, { kind: "field", name: "flags", static: false, private: false, access: { has: obj => "flags" in obj, get: obj => obj.flags, set: (obj, value) => { obj.flags = value; } }, metadata: _metadata }, _flags_initializers, _flags_extraInitializers);
            __esDecorate(null, null, _compressionMethod_decorators, { kind: "field", name: "compressionMethod", static: false, private: false, access: { has: obj => "compressionMethod" in obj, get: obj => obj.compressionMethod, set: (obj, value) => { obj.compressionMethod = value; } }, metadata: _metadata }, _compressionMethod_initializers, _compressionMethod_extraInitializers);
            __esDecorate(null, null, _datetime_decorators, { kind: "field", name: "datetime", static: false, private: false, access: { has: obj => "datetime" in obj, get: obj => obj.datetime, set: (obj, value) => { obj.datetime = value; } }, metadata: _metadata }, _datetime_initializers, _datetime_extraInitializers);
            __esDecorate(null, null, _crc32_decorators, { kind: "field", name: "crc32", static: false, private: false, access: { has: obj => "crc32" in obj, get: obj => obj.crc32, set: (obj, value) => { obj.crc32 = value; } }, metadata: _metadata }, _crc32_initializers, _crc32_extraInitializers);
            __esDecorate(null, null, _compressedSize_decorators, { kind: "field", name: "compressedSize", static: false, private: false, access: { has: obj => "compressedSize" in obj, get: obj => obj.compressedSize, set: (obj, value) => { obj.compressedSize = value; } }, metadata: _metadata }, _compressedSize_initializers, _compressedSize_extraInitializers);
            __esDecorate(null, null, _uncompressedSize_decorators, { kind: "field", name: "uncompressedSize", static: false, private: false, access: { has: obj => "uncompressedSize" in obj, get: obj => obj.uncompressedSize, set: (obj, value) => { obj.uncompressedSize = value; } }, metadata: _metadata }, _uncompressedSize_initializers, _uncompressedSize_extraInitializers);
            __esDecorate(null, null, _nameLength_decorators, { kind: "field", name: "nameLength", static: false, private: false, access: { has: obj => "nameLength" in obj, get: obj => obj.nameLength, set: (obj, value) => { obj.nameLength = value; } }, metadata: _metadata }, _nameLength_initializers, _nameLength_extraInitializers);
            __esDecorate(null, null, _extraLength_decorators, { kind: "field", name: "extraLength", static: false, private: false, access: { has: obj => "extraLength" in obj, get: obj => obj.extraLength, set: (obj, value) => { obj.extraLength = value; } }, metadata: _metadata }, _extraLength_initializers, _extraLength_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            LocalFileHeader = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        data;
        constructor(data) {
            __runInitializers(this, _extraLength_extraInitializers);
            this.data = data;
            deserialize(this, data);
            if (this.signature !== 0x04034b50) {
                throw new ErrnoError(Errno.EINVAL, 'Invalid Zip file: Local file header has invalid signature: ' + this.signature);
            }
        }
        signature = __runInitializers(this, _signature_initializers, void 0);
        /**
         * The minimum supported ZIP specification version needed to extract the file.
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.3
         */
        versionNeeded = (__runInitializers(this, _signature_extraInitializers), __runInitializers(this, _versionNeeded_initializers, void 0));
        /**
         * General purpose bit flags
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.4
         */
        flags = (__runInitializers(this, _versionNeeded_extraInitializers), __runInitializers(this, _flags_initializers, void 0));
        /**
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.5
         */
        compressionMethod = (__runInitializers(this, _flags_extraInitializers), __runInitializers(this, _compressionMethod_initializers, void 0));
        /**
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.6
         */
        datetime = (__runInitializers(this, _compressionMethod_extraInitializers), __runInitializers(this, _datetime_initializers, void 0));
        /**
         * The date and time are encoded in standard MS-DOS format.
         * This getter decodes the date.
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.6
         */
        get lastModified() {
            return msdosDate(this.datetime);
        }
        /**
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.7
         */
        crc32 = (__runInitializers(this, _datetime_extraInitializers), __runInitializers(this, _crc32_initializers, void 0));
        /**
         * The size of the file compressed.
         * If bit 3 of the general purpose bit flag is set, set to zero.
         * central directory's entry is used
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.8
         */
        compressedSize = (__runInitializers(this, _crc32_extraInitializers), __runInitializers(this, _compressedSize_initializers, void 0));
        /**
         * The size of the file uncompressed
         * If bit 3 of the general purpose bit flag is set, set to zero.
         * central directory's entry is used
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.9
         */
        uncompressedSize = (__runInitializers(this, _compressedSize_extraInitializers), __runInitializers(this, _uncompressedSize_initializers, void 0));
        /**
         * The length of the file name
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.10
         */
        nameLength = (__runInitializers(this, _uncompressedSize_extraInitializers), __runInitializers(this, _nameLength_initializers, void 0));
        /**
         * The length of the extra field
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.11
         */
        extraLength = (__runInitializers(this, _nameLength_extraInitializers), __runInitializers(this, _extraLength_initializers, void 0));
        /**
         * The name of the file, with optional relative path.
         * @see CentralDirectory.fileName
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.17
         */
        get name() {
            return safeDecode(this.data, this.useUTF8, 30, this.nameLength);
        }
        /**
         * This should be used for storage expansion.
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.28
         */
        get extra() {
            const start = 30 + this.nameLength;
            return this.data.slice(start, start + this.extraLength);
        }
        get size() {
            return 30 + this.nameLength + this.extraLength;
        }
        get useUTF8() {
            return !!(this.flags & (1 << 11));
        }
    };
    return LocalFileHeader = _classThis;
})();
export { LocalFileHeader };
/**
 * Archive extra data record
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.11
 */
let ExtraDataRecord = (() => {
    var _a, _b;
    let _classDecorators = [struct()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _signature_decorators;
    let _signature_initializers = [];
    let _signature_extraInitializers = [];
    let _length_decorators;
    let _length_initializers = [];
    let _length_extraInitializers = [];
    var ExtraDataRecord = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _signature_decorators = [(_a = t).uint32.bind(_a)];
            _length_decorators = [(_b = t).uint32.bind(_b)];
            __esDecorate(null, null, _signature_decorators, { kind: "field", name: "signature", static: false, private: false, access: { has: obj => "signature" in obj, get: obj => obj.signature, set: (obj, value) => { obj.signature = value; } }, metadata: _metadata }, _signature_initializers, _signature_extraInitializers);
            __esDecorate(null, null, _length_decorators, { kind: "field", name: "length", static: false, private: false, access: { has: obj => "length" in obj, get: obj => obj.length, set: (obj, value) => { obj.length = value; } }, metadata: _metadata }, _length_initializers, _length_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ExtraDataRecord = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        data;
        signature = __runInitializers(this, _signature_initializers, void 0);
        length = (__runInitializers(this, _signature_extraInitializers), __runInitializers(this, _length_initializers, void 0));
        constructor(data) {
            __runInitializers(this, _length_extraInitializers);
            this.data = data;
            deserialize(this, data);
            if (this.signature != 0x08064b50) {
                throw new ErrnoError(Errno.EINVAL, 'Invalid archive extra data record signature: ' + this.signature);
            }
        }
        /**
         * This should be used for storage expansion.
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.28
         */
        get extraField() {
            return this.data.slice(8, 8 + this.length);
        }
    };
    return ExtraDataRecord = _classThis;
})();
export { ExtraDataRecord };
/**
 * @hidden
 * Inlined for performance
 */
export const sizeof_FileEntry = 46;
/**
 * Refered to as a "central directory" record in the spec.
 * This is a file metadata entry inside the "central directory".
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.12
 */
let FileEntry = (() => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    let _classDecorators = [struct()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _signature_decorators;
    let _signature_initializers = [];
    let _signature_extraInitializers = [];
    let _zipVersion_decorators;
    let _zipVersion_initializers = [];
    let _zipVersion_extraInitializers = [];
    let _attributeCompat_decorators;
    let _attributeCompat_initializers = [];
    let _attributeCompat_extraInitializers = [];
    let _versionNeeded_decorators;
    let _versionNeeded_initializers = [];
    let _versionNeeded_extraInitializers = [];
    let _flag_decorators;
    let _flag_initializers = [];
    let _flag_extraInitializers = [];
    let _compressionMethod_decorators;
    let _compressionMethod_initializers = [];
    let _compressionMethod_extraInitializers = [];
    let _datetime_decorators;
    let _datetime_initializers = [];
    let _datetime_extraInitializers = [];
    let _crc32_decorators;
    let _crc32_initializers = [];
    let _crc32_extraInitializers = [];
    let _compressedSize_decorators;
    let _compressedSize_initializers = [];
    let _compressedSize_extraInitializers = [];
    let _uncompressedSize_decorators;
    let _uncompressedSize_initializers = [];
    let _uncompressedSize_extraInitializers = [];
    let _nameLength_decorators;
    let _nameLength_initializers = [];
    let _nameLength_extraInitializers = [];
    let _extraLength_decorators;
    let _extraLength_initializers = [];
    let _extraLength_extraInitializers = [];
    let _commentLength_decorators;
    let _commentLength_initializers = [];
    let _commentLength_extraInitializers = [];
    let _startDisk_decorators;
    let _startDisk_initializers = [];
    let _startDisk_extraInitializers = [];
    let _internalAttributes_decorators;
    let _internalAttributes_initializers = [];
    let _internalAttributes_extraInitializers = [];
    let _externalAttributes_decorators;
    let _externalAttributes_initializers = [];
    let _externalAttributes_extraInitializers = [];
    let _headerRelativeOffset_decorators;
    let _headerRelativeOffset_initializers = [];
    let _headerRelativeOffset_extraInitializers = [];
    var FileEntry = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _signature_decorators = [(_a = t).uint32.bind(_a)];
            _zipVersion_decorators = [(_b = t).uint8.bind(_b)];
            _attributeCompat_decorators = [(_c = t).uint8.bind(_c)];
            _versionNeeded_decorators = [(_d = t).uint16.bind(_d)];
            _flag_decorators = [(_e = t).uint16.bind(_e)];
            _compressionMethod_decorators = [(_f = t).uint16.bind(_f)];
            _datetime_decorators = [(_g = t).uint32.bind(_g)];
            _crc32_decorators = [(_h = t).uint32.bind(_h)];
            _compressedSize_decorators = [(_j = t).uint32.bind(_j)];
            _uncompressedSize_decorators = [(_k = t).uint32.bind(_k)];
            _nameLength_decorators = [(_l = t).uint16.bind(_l)];
            _extraLength_decorators = [(_m = t).uint16.bind(_m)];
            _commentLength_decorators = [(_o = t).uint16.bind(_o)];
            _startDisk_decorators = [(_p = t).uint16.bind(_p)];
            _internalAttributes_decorators = [(_q = t).uint16.bind(_q)];
            _externalAttributes_decorators = [(_r = t).uint32.bind(_r)];
            _headerRelativeOffset_decorators = [(_s = t).uint32.bind(_s)];
            __esDecorate(null, null, _signature_decorators, { kind: "field", name: "signature", static: false, private: false, access: { has: obj => "signature" in obj, get: obj => obj.signature, set: (obj, value) => { obj.signature = value; } }, metadata: _metadata }, _signature_initializers, _signature_extraInitializers);
            __esDecorate(null, null, _zipVersion_decorators, { kind: "field", name: "zipVersion", static: false, private: false, access: { has: obj => "zipVersion" in obj, get: obj => obj.zipVersion, set: (obj, value) => { obj.zipVersion = value; } }, metadata: _metadata }, _zipVersion_initializers, _zipVersion_extraInitializers);
            __esDecorate(null, null, _attributeCompat_decorators, { kind: "field", name: "attributeCompat", static: false, private: false, access: { has: obj => "attributeCompat" in obj, get: obj => obj.attributeCompat, set: (obj, value) => { obj.attributeCompat = value; } }, metadata: _metadata }, _attributeCompat_initializers, _attributeCompat_extraInitializers);
            __esDecorate(null, null, _versionNeeded_decorators, { kind: "field", name: "versionNeeded", static: false, private: false, access: { has: obj => "versionNeeded" in obj, get: obj => obj.versionNeeded, set: (obj, value) => { obj.versionNeeded = value; } }, metadata: _metadata }, _versionNeeded_initializers, _versionNeeded_extraInitializers);
            __esDecorate(null, null, _flag_decorators, { kind: "field", name: "flag", static: false, private: false, access: { has: obj => "flag" in obj, get: obj => obj.flag, set: (obj, value) => { obj.flag = value; } }, metadata: _metadata }, _flag_initializers, _flag_extraInitializers);
            __esDecorate(null, null, _compressionMethod_decorators, { kind: "field", name: "compressionMethod", static: false, private: false, access: { has: obj => "compressionMethod" in obj, get: obj => obj.compressionMethod, set: (obj, value) => { obj.compressionMethod = value; } }, metadata: _metadata }, _compressionMethod_initializers, _compressionMethod_extraInitializers);
            __esDecorate(null, null, _datetime_decorators, { kind: "field", name: "datetime", static: false, private: false, access: { has: obj => "datetime" in obj, get: obj => obj.datetime, set: (obj, value) => { obj.datetime = value; } }, metadata: _metadata }, _datetime_initializers, _datetime_extraInitializers);
            __esDecorate(null, null, _crc32_decorators, { kind: "field", name: "crc32", static: false, private: false, access: { has: obj => "crc32" in obj, get: obj => obj.crc32, set: (obj, value) => { obj.crc32 = value; } }, metadata: _metadata }, _crc32_initializers, _crc32_extraInitializers);
            __esDecorate(null, null, _compressedSize_decorators, { kind: "field", name: "compressedSize", static: false, private: false, access: { has: obj => "compressedSize" in obj, get: obj => obj.compressedSize, set: (obj, value) => { obj.compressedSize = value; } }, metadata: _metadata }, _compressedSize_initializers, _compressedSize_extraInitializers);
            __esDecorate(null, null, _uncompressedSize_decorators, { kind: "field", name: "uncompressedSize", static: false, private: false, access: { has: obj => "uncompressedSize" in obj, get: obj => obj.uncompressedSize, set: (obj, value) => { obj.uncompressedSize = value; } }, metadata: _metadata }, _uncompressedSize_initializers, _uncompressedSize_extraInitializers);
            __esDecorate(null, null, _nameLength_decorators, { kind: "field", name: "nameLength", static: false, private: false, access: { has: obj => "nameLength" in obj, get: obj => obj.nameLength, set: (obj, value) => { obj.nameLength = value; } }, metadata: _metadata }, _nameLength_initializers, _nameLength_extraInitializers);
            __esDecorate(null, null, _extraLength_decorators, { kind: "field", name: "extraLength", static: false, private: false, access: { has: obj => "extraLength" in obj, get: obj => obj.extraLength, set: (obj, value) => { obj.extraLength = value; } }, metadata: _metadata }, _extraLength_initializers, _extraLength_extraInitializers);
            __esDecorate(null, null, _commentLength_decorators, { kind: "field", name: "commentLength", static: false, private: false, access: { has: obj => "commentLength" in obj, get: obj => obj.commentLength, set: (obj, value) => { obj.commentLength = value; } }, metadata: _metadata }, _commentLength_initializers, _commentLength_extraInitializers);
            __esDecorate(null, null, _startDisk_decorators, { kind: "field", name: "startDisk", static: false, private: false, access: { has: obj => "startDisk" in obj, get: obj => obj.startDisk, set: (obj, value) => { obj.startDisk = value; } }, metadata: _metadata }, _startDisk_initializers, _startDisk_extraInitializers);
            __esDecorate(null, null, _internalAttributes_decorators, { kind: "field", name: "internalAttributes", static: false, private: false, access: { has: obj => "internalAttributes" in obj, get: obj => obj.internalAttributes, set: (obj, value) => { obj.internalAttributes = value; } }, metadata: _metadata }, _internalAttributes_initializers, _internalAttributes_extraInitializers);
            __esDecorate(null, null, _externalAttributes_decorators, { kind: "field", name: "externalAttributes", static: false, private: false, access: { has: obj => "externalAttributes" in obj, get: obj => obj.externalAttributes, set: (obj, value) => { obj.externalAttributes = value; } }, metadata: _metadata }, _externalAttributes_initializers, _externalAttributes_extraInitializers);
            __esDecorate(null, null, _headerRelativeOffset_decorators, { kind: "field", name: "headerRelativeOffset", static: false, private: false, access: { has: obj => "headerRelativeOffset" in obj, get: obj => obj.headerRelativeOffset, set: (obj, value) => { obj.headerRelativeOffset = value; } }, metadata: _metadata }, _headerRelativeOffset_initializers, _headerRelativeOffset_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FileEntry = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        zipData;
        _data;
        constructor(zipData, _data) {
            this.zipData = zipData;
            this._data = _data;
            deserialize(this, _data);
            // Sanity check.
            if (this.signature != 0x02014b50) {
                throw new ErrnoError(Errno.EINVAL, 'Invalid Zip file: Central directory record has invalid signature: ' + this.signature);
            }
            this.name = safeDecode(this._data, this.useUTF8, sizeof_FileEntry, this.nameLength).replace(/\\/g, '/');
            this.comment = safeDecode(this._data, this.useUTF8, sizeof_FileEntry + this.nameLength + this.extraLength, this.commentLength);
        }
        signature = __runInitializers(this, _signature_initializers, void 0);
        /**
         * The lower byte of "version made by", indicates the ZIP specification version supported by the software used to encode the file.
         * major — floor `zipVersion` / 10
         * minor — `zipVersion` mod 10
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.2
         */
        zipVersion = (__runInitializers(this, _signature_extraInitializers), __runInitializers(this, _zipVersion_initializers, void 0));
        /**
         * The upper byte of "version made by", indicates the compatibility of the file attribute information.
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.2
         */
        attributeCompat = (__runInitializers(this, _zipVersion_extraInitializers), __runInitializers(this, _attributeCompat_initializers, void 0));
        /**
         * The minimum supported ZIP specification version needed to extract the file.
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.3
         */
        versionNeeded = (__runInitializers(this, _attributeCompat_extraInitializers), __runInitializers(this, _versionNeeded_initializers, void 0));
        /**
         * General purpose bit flags
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.4
         */
        flag = (__runInitializers(this, _versionNeeded_extraInitializers), __runInitializers(this, _flag_initializers, void 0));
        get useUTF8() {
            return !!(this.flag & (1 << 11));
        }
        get isEncrypted() {
            return !!(this.flag & 1);
        }
        /**
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.5
         */
        compressionMethod = (__runInitializers(this, _flag_extraInitializers), __runInitializers(this, _compressionMethod_initializers, void 0));
        /**
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.6
         */
        datetime = (__runInitializers(this, _compressionMethod_extraInitializers), __runInitializers(this, _datetime_initializers, void 0));
        /**
         * The date and time are encoded in standard MS-DOS format.
         * This getter decodes the date.
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.6
         */
        get lastModified() {
            return msdosDate(this.datetime);
        }
        /**
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.7
         */
        crc32 = (__runInitializers(this, _datetime_extraInitializers), __runInitializers(this, _crc32_initializers, void 0));
        /**
         * The size of the file compressed
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.8
         */
        compressedSize = (__runInitializers(this, _crc32_extraInitializers), __runInitializers(this, _compressedSize_initializers, void 0));
        /**
         * The size of the file uncompressed
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.9
         */
        uncompressedSize = (__runInitializers(this, _compressedSize_extraInitializers), __runInitializers(this, _uncompressedSize_initializers, void 0));
        /**
         * The length of the file name
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.10
         */
        nameLength = (__runInitializers(this, _uncompressedSize_extraInitializers), __runInitializers(this, _nameLength_initializers, void 0));
        /**
         * The length of the extra field
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.11
         */
        extraLength = (__runInitializers(this, _nameLength_extraInitializers), __runInitializers(this, _extraLength_initializers, void 0));
        /**
         * The length of the comment
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.12
         */
        commentLength = (__runInitializers(this, _extraLength_extraInitializers), __runInitializers(this, _commentLength_initializers, void 0));
        /**
         * The number of the disk on which this file begins.
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.13
         */
        startDisk = (__runInitializers(this, _commentLength_extraInitializers), __runInitializers(this, _startDisk_initializers, void 0));
        /**
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.14
         */
        internalAttributes = (__runInitializers(this, _startDisk_extraInitializers), __runInitializers(this, _internalAttributes_initializers, void 0));
        /**
         * The mapping of the external attributes is host-system dependent.
         * For MS-DOS, the low order byte is the MS-DOS directory attribute byte.
         * If input came from standard input, this field is set to zero.
         * @see attributeCompat
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.15
         */
        externalAttributes = (__runInitializers(this, _internalAttributes_extraInitializers), __runInitializers(this, _externalAttributes_initializers, void 0));
        /**
         * This is the offset from the start of the first disk on which
         * this file appears to where the local header should be found.
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.16
         */
        headerRelativeOffset = (__runInitializers(this, _externalAttributes_extraInitializers), __runInitializers(this, _headerRelativeOffset_initializers, void 0));
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
        name = __runInitializers(this, _headerRelativeOffset_extraInitializers);
        /**
         * This should be used for storage expansion.
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.28
         */
        get extra() {
            const offset = 44 + this.nameLength;
            return this._data.slice(offset, offset + this.extraLength);
        }
        /**
         * The comment for this file
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.18
         */
        comment;
        /**
         * The total size of the this entry
         */
        get size() {
            return sizeof(FileEntry) + this.nameLength + this.extraLength + this.commentLength;
        }
        /**
         * Whether this entry is a directory
         */
        get isDirectory() {
            /*
                NOTE: This assumes that the zip file implementation uses the lower byte
                of external attributes for DOS attributes for backwards-compatibility.
                This is not mandated, but appears to be commonplace.
                According to the spec, the layout of external attributes is platform-dependent.
                If that fails, we also check if the name of the file ends in '/'.
            */
            return !!(this.externalAttributes & 16) || this.name.endsWith('/');
        }
        /**
         * Whether this entry is a file
         */
        get isFile() {
            return !this.isDirectory;
        }
        /**
         * Gets the file data, and decompresses it if needed.
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.8
         */
        get data() {
            // Get the local header before we can figure out where the actual compressed data starts.
            const { compressionMethod, size, name } = new LocalFileHeader(this.zipData.slice(this.headerRelativeOffset));
            const data = this.zipData.slice(this.headerRelativeOffset + size);
            // Check the compression
            const decompress = decompressionMethods[compressionMethod];
            if (typeof decompress != 'function') {
                const mname = compressionMethod in CompressionMethod ? CompressionMethod[compressionMethod] : compressionMethod.toString();
                throw new ErrnoError(Errno.EINVAL, `Invalid compression method on file '${name}': ${mname}`);
            }
            return decompress(data, this.compressedSize, this.uncompressedSize, this.flag);
        }
        get stats() {
            return new Stats({
                mode: 0o555 | (this.isDirectory ? S_IFDIR : S_IFREG),
                size: this.uncompressedSize,
                mtimeMs: this.lastModified.getTime(),
            });
        }
    };
    return FileEntry = _classThis;
})();
export { FileEntry };
/**
 * Digital signature
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.13
 */
let DigitalSignature = (() => {
    var _a, _b;
    let _classDecorators = [struct()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _signature_decorators;
    let _signature_initializers = [];
    let _signature_extraInitializers = [];
    let _size_decorators;
    let _size_initializers = [];
    let _size_extraInitializers = [];
    var DigitalSignature = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _signature_decorators = [(_a = t).uint32.bind(_a)];
            _size_decorators = [(_b = t).uint16.bind(_b)];
            __esDecorate(null, null, _signature_decorators, { kind: "field", name: "signature", static: false, private: false, access: { has: obj => "signature" in obj, get: obj => obj.signature, set: (obj, value) => { obj.signature = value; } }, metadata: _metadata }, _signature_initializers, _signature_extraInitializers);
            __esDecorate(null, null, _size_decorators, { kind: "field", name: "size", static: false, private: false, access: { has: obj => "size" in obj, get: obj => obj.size, set: (obj, value) => { obj.size = value; } }, metadata: _metadata }, _size_initializers, _size_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DigitalSignature = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        data;
        constructor(data) {
            __runInitializers(this, _size_extraInitializers);
            this.data = data;
            deserialize(this, data);
            if (this.signature != 0x05054b50) {
                throw new ErrnoError(Errno.EINVAL, 'Invalid digital signature signature: ' + this.signature);
            }
        }
        signature = __runInitializers(this, _signature_initializers, void 0);
        size = (__runInitializers(this, _signature_extraInitializers), __runInitializers(this, _size_initializers, void 0));
        get signatureData() {
            return this.data.slice(6, 6 + this.size);
        }
    };
    return DigitalSignature = _classThis;
})();
export { DigitalSignature };
/**
 * Overall ZIP file header.
 * Also call "end of central directory record"
 * Internally, ZIP files have only a single directory: the "central directory".
 * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.3.16
 */
let Header = (() => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    let _classDecorators = [struct()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _signature_decorators;
    let _signature_initializers = [];
    let _signature_extraInitializers = [];
    let _disk_decorators;
    let _disk_initializers = [];
    let _disk_extraInitializers = [];
    let _entriesDisk_decorators;
    let _entriesDisk_initializers = [];
    let _entriesDisk_extraInitializers = [];
    let _diskEntryCount_decorators;
    let _diskEntryCount_initializers = [];
    let _diskEntryCount_extraInitializers = [];
    let _totalEntryCount_decorators;
    let _totalEntryCount_initializers = [];
    let _totalEntryCount_extraInitializers = [];
    let _size_decorators;
    let _size_initializers = [];
    let _size_extraInitializers = [];
    let _offset_decorators;
    let _offset_initializers = [];
    let _offset_extraInitializers = [];
    let _commentLength_decorators;
    let _commentLength_initializers = [];
    let _commentLength_extraInitializers = [];
    var Header = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _signature_decorators = [(_a = t).uint32.bind(_a)];
            _disk_decorators = [(_b = t).uint16.bind(_b)];
            _entriesDisk_decorators = [(_c = t).uint16.bind(_c)];
            _diskEntryCount_decorators = [(_d = t).uint16.bind(_d)];
            _totalEntryCount_decorators = [(_e = t).uint16.bind(_e)];
            _size_decorators = [(_f = t).uint32.bind(_f)];
            _offset_decorators = [(_g = t).uint32.bind(_g)];
            _commentLength_decorators = [(_h = t).uint16.bind(_h)];
            __esDecorate(null, null, _signature_decorators, { kind: "field", name: "signature", static: false, private: false, access: { has: obj => "signature" in obj, get: obj => obj.signature, set: (obj, value) => { obj.signature = value; } }, metadata: _metadata }, _signature_initializers, _signature_extraInitializers);
            __esDecorate(null, null, _disk_decorators, { kind: "field", name: "disk", static: false, private: false, access: { has: obj => "disk" in obj, get: obj => obj.disk, set: (obj, value) => { obj.disk = value; } }, metadata: _metadata }, _disk_initializers, _disk_extraInitializers);
            __esDecorate(null, null, _entriesDisk_decorators, { kind: "field", name: "entriesDisk", static: false, private: false, access: { has: obj => "entriesDisk" in obj, get: obj => obj.entriesDisk, set: (obj, value) => { obj.entriesDisk = value; } }, metadata: _metadata }, _entriesDisk_initializers, _entriesDisk_extraInitializers);
            __esDecorate(null, null, _diskEntryCount_decorators, { kind: "field", name: "diskEntryCount", static: false, private: false, access: { has: obj => "diskEntryCount" in obj, get: obj => obj.diskEntryCount, set: (obj, value) => { obj.diskEntryCount = value; } }, metadata: _metadata }, _diskEntryCount_initializers, _diskEntryCount_extraInitializers);
            __esDecorate(null, null, _totalEntryCount_decorators, { kind: "field", name: "totalEntryCount", static: false, private: false, access: { has: obj => "totalEntryCount" in obj, get: obj => obj.totalEntryCount, set: (obj, value) => { obj.totalEntryCount = value; } }, metadata: _metadata }, _totalEntryCount_initializers, _totalEntryCount_extraInitializers);
            __esDecorate(null, null, _size_decorators, { kind: "field", name: "size", static: false, private: false, access: { has: obj => "size" in obj, get: obj => obj.size, set: (obj, value) => { obj.size = value; } }, metadata: _metadata }, _size_initializers, _size_extraInitializers);
            __esDecorate(null, null, _offset_decorators, { kind: "field", name: "offset", static: false, private: false, access: { has: obj => "offset" in obj, get: obj => obj.offset, set: (obj, value) => { obj.offset = value; } }, metadata: _metadata }, _offset_initializers, _offset_extraInitializers);
            __esDecorate(null, null, _commentLength_decorators, { kind: "field", name: "commentLength", static: false, private: false, access: { has: obj => "commentLength" in obj, get: obj => obj.commentLength, set: (obj, value) => { obj.commentLength = value; } }, metadata: _metadata }, _commentLength_initializers, _commentLength_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            Header = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        data;
        constructor(data) {
            __runInitializers(this, _commentLength_extraInitializers);
            this.data = data;
            deserialize(this, data);
            if (this.signature != 0x06054b50) {
                throw new ErrnoError(Errno.EINVAL, 'Invalid Zip file: End of central directory record has invalid signature: 0x' + this.signature.toString(16));
            }
        }
        signature = __runInitializers(this, _signature_initializers, void 0);
        /**
         * The number of this disk
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.19
         */
        disk = (__runInitializers(this, _signature_extraInitializers), __runInitializers(this, _disk_initializers, void 0));
        /**
         * The number of the disk with the start of the entries
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.20
         */
        entriesDisk = (__runInitializers(this, _disk_extraInitializers), __runInitializers(this, _entriesDisk_initializers, void 0));
        /**
         * Total number of entries on this disk
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.21
         */
        diskEntryCount = (__runInitializers(this, _entriesDisk_extraInitializers), __runInitializers(this, _diskEntryCount_initializers, void 0));
        /**
         * Total number of entries
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.22
         */
        totalEntryCount = (__runInitializers(this, _diskEntryCount_extraInitializers), __runInitializers(this, _totalEntryCount_initializers, void 0));
        /**
         * Size of the "central directory"
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.23
         */
        size = (__runInitializers(this, _totalEntryCount_extraInitializers), __runInitializers(this, _size_initializers, void 0));
        /**
         * Offset of start of "central directory" with respect to the starting disk number
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.24
         */
        offset = (__runInitializers(this, _size_extraInitializers), __runInitializers(this, _offset_initializers, void 0));
        /**
         * Comment length
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.25
         */
        commentLength = (__runInitializers(this, _offset_extraInitializers), __runInitializers(this, _commentLength_initializers, void 0));
        /**
         * Assuming the content is UTF-8 encoded. The specification doesn't specify.
         * @see http://pkware.com/documents/casestudies/APPNOTE.TXT#:~:text=4.4.26
         */
        get comment() {
            return safeDecode(this.data, true, 22, this.commentLength);
        }
    };
    return Header = _classThis;
})();
export { Header };
//# sourceMappingURL=zip.js.map