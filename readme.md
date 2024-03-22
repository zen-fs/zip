# ZenFS `iso` Backend

[ZenFS](https://github.com/zen-fs/core) backend for `iso` files.

> [!IMPORTANT]
> Please read the ZenFS core documentation!

## Backend

This package adds the `Iso` backend, which allows you to create a _readonly_ file system from a iso file.

For more information, see the [API documentation](https://zen-fs.github.io/iso).

## Installing

```sh
npm install @zenfs/iso
```

## Usage

> [!NOTE]
> The examples are written in ESM. If you are using CJS, you can `require` the package. If running in a browser you can add a script tag to your HTML pointing to the `browser.min.js` and use ZenFS Iso via the global `ZenFS_ISO` object.

```js
import { configure, fs } from '@zenfs/core';
import { Iso } from '@zenfs/iso';

const res = await fetch('http://example.com/image.iso');

await configure({
	'/mnt/iso': { backend: Iso, isoData: await res.arrayBuffer() },
});

const contents = fs.readFileSync('/mnt/iso/in-image.txt', 'utf-8');
console.log(contents);
```
