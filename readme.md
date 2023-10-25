# BrowserFS `iso` Backend

[BrowserFS](https://github.com/browser-fs/core) backend for `iso` files.

Please read the BrowserFS documentation!

## Backend

This package adds `IsoFS`, which allows you to create a *readonly* file system from a iso file.

For more information, see the [API documentation](https://browser-fs.github.io/fs-iso).

## Installing

```sh
npm install @browserfs/fs-iso
```

## Usage

> 🛈 The examples are written in ESM. If you are using CJS, you can `require` the package. If running in a browser you can add a script tag to your HTML pointing to the `browser.min.js` and use BrowserFS Iso via the global `BrowserFS_ISO` object.

You can't use IsoFS on its own. You must import the core in order to use the backend, and must register it if you plan on using `configure`:

```js
import { configure, fs, registerBackend } from '@browserfs/core';
import { IsoFS } from '@browserfs/fs-iso';
registerBackend(IsoFS);

const res = await fetch('http://example.com/image.iso');
const isoData = await res.arrayBuffer();

await configure({ '/mnt/iso': { fs: 'IsoFS', options: { isoData } } });

const contents = fs.readFileSync('/mnt/iso/in-image.txt', 'utf-8');
console.log(contents);
```
