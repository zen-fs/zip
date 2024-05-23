/* eslint-disable no-debugger */
import { configure, fs } from '@zenfs/core';
import { readFileSync } from 'fs';
import { Zip } from '../dist/ZipFS.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

describe('Basic ZIP operations', () => {
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
		expect(fs.readdirSync('/').length).toBe(3);
	});

	test('read /one.txt', () => {
		expect(fs.readFileSync('/one.txt', 'utf8')).toBe('1');
	});

	test('read /two.txt', () => {
		expect(fs.readFileSync('/two.txt', 'utf8')).toBe('two');
	});

	test('readdir /nested', () => {
		expect(fs.readdirSync('/nested').length).toBe(1);
	});

	test('readdir /nested/omg.txt', () => {
		expect(fs.readFileSync('/nested/omg.txt', 'utf8')).toBe('This is a nested file!');
	});
});
