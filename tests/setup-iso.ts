import { configureSingle, InMemory, Overlay } from '@zenfs/core';
import { readFileSync } from 'node:fs';
import { Iso } from '../dist/iso/fs.js';

await configureSingle({
	backend: Overlay,
	readable: Iso.create({
		data: readFileSync(import.meta.dirname + '/files/core.iso'),
		name: 'core.iso',
	}),
	writable: InMemory.create({ name: 'tests' }),
});
