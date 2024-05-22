/* eslint-disable no-debugger */
import { configure, fs } from '@zenfs/core';
import { readFileSync } from 'fs';
import { Zip } from '../dist/ZipFS.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

describe('Basic zip file', () => {
	test('Configure', async () => {
		const buffer = readFileSync(dirname(fileURLToPath(import.meta.url)) + '/data.zip');
		const data = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
		await configure<typeof Zip>({
			mounts: {
				'/': { backend: Zip, data },
			},
		});
	});

	test('readdir /', () => {
		expect(fs.readdirSync('/').length).toBe(2);
	});

	test('read #1', () => {
		expect(fs.readFileSync('/one.txt', 'utf8')).toBe('1');
	});

	test('read #2', () => {
		expect(fs.readFileSync('/two.txt', 'utf8')).toBe('two');
	});
});
