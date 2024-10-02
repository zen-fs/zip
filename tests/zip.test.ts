import { configureSingle, fs } from '@zenfs/core';
import { readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Zip } from '../src/ZipFS.js';
import { test, suite } from 'node:test';
import { equal } from 'node:assert';

suite('Basic ZIP operations', () => {
	test('Configure', async () => {
		const buffer = readFileSync(dirname(fileURLToPath(import.meta.url)) + '/data.zip');
		const data = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
		await configureSingle({ backend: Zip, data });
	});

	test('readdir /', () => {
		equal(fs.readdirSync('/').length, 3);
	});

	test('read /one.txt', () => {
		equal(fs.readFileSync('/one.txt', 'utf8'), '1');
	});

	test('read /two.txt', () => {
		equal(fs.readFileSync('/two.txt', 'utf8'), 'two');
	});

	test('readdir /nested', () => {
		equal(fs.readdirSync('/nested').length, 1);
	});

	test('readdir /nested/omg.txt', () => {
		equal(fs.readFileSync('/nested/omg.txt', 'utf8'), 'This is a nested file!');
	});
});
