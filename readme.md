# BrowserFS `iso` Backend

[BrowserFS](https://github.com/browser-fs/core) backend for `iso` files.

> [!IMPORTANT]
> Please read the BrowserFS core documentation!

## Backend

This package adds the `Iso` backend, which allows you to create a _readonly_ file system from a iso file.

For more information, see the [API documentation](https://browser-fs.github.io/iso).

## Installing

```sh
npm install @browserfs/iso
```

## Usage

> [!NOTE]
> The examples are written in ESM. If you are using CJS, you can `require` the package. If running in a browser you can add a script tag to your HTML pointing to the `browser.min.js` and use BrowserFS Iso via the global `BrowserFS_ISO` object.

```js
import { configure, fs } from '@browserfs/core';
import { Iso } from '@browserfs/iso';

const res = await fetch('http://example.com/image.iso');

await configure({
	'/mnt/iso': { backend: Iso, isoData: await res.arrayBuffer() },
});

const contents = fs.readFileSync('/mnt/iso/in-image.txt', 'utf-8');
console.log(contents);
```
