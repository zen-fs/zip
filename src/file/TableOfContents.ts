import { FileIndex } from '@browserfs/core/FileIndex.js';
import { CentralDirectory } from './CentralDirectory.js';
import { EndOfCentralDirectory } from './EndOfCentralDirectory.js';

/**
 * Contains the table of contents of a Zip file.
 */

export class TableOfContents {
	constructor(public index: FileIndex<CentralDirectory>, public directoryEntries: CentralDirectory[], public eocd: EndOfCentralDirectory, public data: ArrayBuffer) {}
}
