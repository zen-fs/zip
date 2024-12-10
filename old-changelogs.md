# Changelog for `@zenfs/zip`

### <a name="zip-v0.5.2" href="#zip-v0.5.2">0.5.2</a>

- Updated dependencies:
    - Utilium to `^1.0.0`
    - Typescript to `^5.5.0`
    - Typedoc
- Fixed duplicate install of Utilium
- Removed bundle from NPM package
- Removed temporary Eslint config

### <a name="zip-v0.5.1" href="#zip-v0.5.1">0.5.1</a>

- Aliased the backend type to an interface
    - This is for cleaner IntelliSense and Typescript errors
- Fixed subdirectories sometimes missing from parent entries (#9)

### <a name="zip-v0.5.0" href="#zip-v0.5.0">0.5.0</a>

- Changed to standard ES decorators
- Enabled Typescript strict mode
- Moved from Jest to Node's native test runner
- Updated Utilium to `^0.7.0`

### <a name="zip-v0.4.9" href="#zip-v0.4.9">0.4.9</a>

Updated `@zenfs/core` to `^1.0.0` and Typescript to `^5.4.0`.

### <a name="zip-v0.4.8" href="#zip-v0.4.8">0.4.8</a>

Removed permission checking, which is done in the emulation layer in core v0.18.0+.

### <a name="zip-v0.4.7" href="#zip-v0.4.7">0.4.7</a>

Changed core dependency to >= so 0.12.3+ can be used.

### <a name="zip-v0.4.6" href="#zip-v0.4.6">0.4.6</a>

`fs.constants` is now used instead of `FileType`.

### <a name="zip-v0.4.5" href="#zip-v0.4.5">0.4.5</a>

Fixed subdirectories being broken (#7)

### <a name="zip-v0.4.4" href="#zip-v0.4.4">0.4.4</a>

Fixed `readdirSync` and `openFileSync` not using `statSync` and suffering from the same missing `/` entry issue.

### <a name="zip-v0.4.3" href="#zip-v0.4.3">0.4.3</a>

Fixed a missing `/` entry causing `ZipFS.statSync` to fail. (#5)

### <a name="zip-v0.4.2" href="#zip-v0.4.2">0.4.2</a>

Changed the global name from `ZenFS_Zip` to `ZenFS_ZIP`.

### <a name="zip-v0.4.1" href="#zip-v0.4.1">0.4.1</a>

Fixed incorrect slice end (#4)

### <a name="zip-v0.4.0" href="#zip-v0.4.0">0.4.0</a>

- Overhauled `ZipFS` - It no longer uses `IndexFS` - Parsing the EOCD and CD entries has been streamlined and inlined into the constructor
- Removed `ZipFS.getCentralDirectoryEntry`
- Removed `ZipFS.getCentralDirectoryEntryAt`
- Fixed `FileEntry.stats` not having the correct file type
- Updated core

### <a name="zip-v0.3.1" href="#zip-v0.3.1">0.3.1</a>

Added tsconfig.json to the NPM package, to prevent Typescript users from breaking.
Also moved `extendedASCIIChars` to utils.ts

### <a name="zip-v0.3.0" href="#zip-v0.3.0">0.3.0</a>

- Overhauled binary views to use `struct` decoration
- Renamed things
    - Removed "file" prefix of many member names
    - Renamed `CentralDirectory` to `FileEntry`
    - Renamed `FileHeader` to `LocalFileHeader`
    - Renamed `ArchiveExtraDataRecord` to `ExtraDataRecord`
    - Renamed `EndOfCentralDirectory` to `Header` (even though it is at the end of the file)
- Combined all zip file parsing into a single file (zip.ts)
- Updated time resolution (Now using a single uint32 instead of uint16 for date and uint16 for time)
- Updated doc comments to link to ZIP spec
- Removed `Data` class
- Removed `rawData` and `fileData` from `FileEntry`
- Signatures are written in hex and 8 characters long, even if that means having a 0 prefix
- Renamed `ExternalFileAttributeType` to `AttributeCompat`
- Changed how some flags are checked (bit shifting instead of decimal values)

### <a name="zip-v0.2.0" href="#zip-v0.2.0">0.2.0</a>

- Removed `typesVersions` and added `src` to package
- Renamed many fields
- Inlined some signatures
- Changed `TableOfContents` to an interface and moved to ZipFS.ts

### <a name="zip-v0.1.5" href="#zip-v0.1.5">0.1.5</a>

Upgraded the core from v0.7.0 to v0.9.2

Thanks @zardoy ([core#47](https://github.com/zen-fs/core/issues/47))

### <a name="zip-v0.1.4" href="#zip-v0.1.4">0.1.4</a>

- Fixed `safeToString` not slicing the buffer when `useUTF8` was `false`.
- Narrowed `Zip` type

### <a name="zip-v0.1.3" href="#zip-v0.1.3">0.1.3</a>

Upgrade core, typescript-eslint, \@Types/node

### <a name="zip-v0.1.2" href="#zip-v0.1.2">0.1.2</a>

Updated to core v0.5.0

### <a name="zip-v0.1.1" href="#zip-v0.1.1">0.1.1</a>

Added a `.` specifier to the `exports` field of `package.json`.

### <a name="zip-v0.1.0" href="#zip-v0.1.0">0.1.0</a>

- Removed usage of some template strings (for security)
- More refactoring of classes to use getters
- Upgraded to the latest core
- Fixed `ready()`

### <a name="zip-v0.0.2" href="#zip-v0.0.2">0.0.2</a>

- Updated build target to ES2020
- Updated to core@0.1.0

### <a name="zip-v0.0.1" href="#zip-v0.0.1">0.0.1</a>

Initial release

# Changelog for `@zenfs/iso`

### <a name="iso-v0.3.3" href="#iso-v0.3.3">0.3.3</a>

Fixed `ShortFormDate` not accounting for the year correctly.

### <a name="iso-v0.3.2" href="#iso-v0.3.2">0.3.2</a>

- Fixed duplicate Utilium version
- Updated Utilium to `^1.0.0`

### <a name="iso-v0.3.1" href="#iso-v0.3.1">0.3.1</a>

- Removed bundle
- Aliased the backend to an interface
- Added tests
- Removed unused reference
- Updated example in readme

### <a name="iso-v0.3.0" href="#iso-v0.3.0">0.3.0</a>

- Changed from working directly with `DataView`s to using Utilium structs
- `Uint8Array`s are now used instead of `ArrayBuffer`s
- Simplified ISO9660 vs Joliet handling
- Added end of file condition to `IsoFS` constructor, preventing an infinite `while` loop
- Renamed `TFFlags` to `TFFlag`
- Refactored `TFEntry`
- `IsoFS` no longer creates a `VolumeDescriptor` to check the type on contruction.
- Removed `getJoiletString`
- Refactored `Directory` to extend `Map`
- Changed to standard ES decorators
- Refactored a lot of code
- Enabled strict mode
- Added tests
- Upgraded utilium to `^0.7.0`

### <a name="iso-v0.2.3" href="#iso-v0.2.3">0.2.3</a>

Removed permission checking, which is done in the emulation layer in core v0.18.0+.

### <a name="iso-v0.2.2" href="#iso-v0.2.2">0.2.2</a>

Updated utilium to >= 0.6.0

### <a name="iso-v0.2.1" href="#iso-v0.2.1">0.2.1</a>

- Bumped utilium version (#1)
- Simplified some imports
- Use core Github workflows and package.json `files` instead of .npmignore

### <a name="iso-v0.2.0" href="#iso-v0.2.0">0.2.0</a>

- Changed global name from `ZenFS_Iso` to `ZenFS_ISO`
- Overhauled to use structs
- Streamlined volume descriptors

### <a name="iso-v0.1.3" href="#iso-v0.1.3">0.1.3</a>

Added tsconfig.json to the NPM package, to prevent Typescript users from breaking.

### <a name="iso-v0.1.2" href="#iso-v0.1.2">0.1.2</a>

Removed Sync from error syscall names
Removed `typesVersions` and added `src` to package
Updated backend type

### <a name="iso-v0.1.1" href="#iso-v0.1.1">0.1.1</a>

Upgraded core, typescript-eslint, build system, \@types/node

### <a name="iso-v0.1.0" href="#iso-v0.1.0">0.1.0</a>

Updated to core v0.5.0

### <a name="iso-v0.0.3" href="#iso-v0.0.3">0.0.3</a>

Added a `.` specifier to the `exports` field of `package.json`.

### <a name="iso-v0.0.2" href="#iso-v0.0.2">0.0.2</a>

- Updated to build target ES2020
- Updated to core@0.1.0

### <a name="iso-v0.0.1" href="#iso-v0.0.1">0.0.1</a>

Initial release
