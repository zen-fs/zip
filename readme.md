# BrowserFS Zip Backend

[BrowserFS](https://github.com/browser-fs/core) backend for Zip files.

Please read the BrowserFS documentation!

## Backend

This package adds the `Zip` backend, which allows you to create a _readonly_ file system from a zip file.

For more information, see the [API documentation](https://browser-fs.github.io/zip).

## Usage

> [!NOTE]
> The examples are written in ESM. If you are using CJS, you can `require` the package. If running in a browser you can add a script tag to your HTML pointing to the `browser.min.js` and use BrowserFS Zip via the global `BrowserFS_Zip` object.

You can't use `Zip` on its own. You must import the core in order to use the backend.

```js
import { configure, fs } from '@browserfs/core';
import { Zip } from '@browserfs/zip';

const res = await fetch('http://example.com/archive.zip');

await configure({
	'/mnt/zip': { backend: Zip, zipData: await res.arrayBuffer() },
});

const contents = fs.readFileSync('/mnt/zip/in-archive.txt', 'utf-8');
console.log(contents);
```
