import { configureSingle, InMemory, Overlay } from '@zenfs/core';
import { readFileSync } from 'node:fs';
import { Zip } from '../dist/zip/fs.js';

const buf = readFileSync(import.meta.dirname + '/files/core.zip');

await configureSingle({
	backend: Overlay,
	readable: Zip.create({
		data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length),
		name: 'core.zip',
	}),
	writable: InMemory.create({ name: 'tests' }),
});
