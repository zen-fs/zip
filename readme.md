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
> The examples are written in ESM.  
> For CJS, you can `require` the package.  
> For a browser environment without support for `type=module` in `script` tags, you can add a `script` tag to your HTML pointing to the `browser.min.js` and use the global `ZenFS_ISO` object.

```js
import { configure, fs } from '@zenfs/core';
import { Iso } from '@zenfs/iso';

const res = await fetch('http://example.com/image.iso');

await configure({
	mounts: {
		'/mnt/iso': { backend: Iso, data: await res.arrayBuffer() },
	},
});

const contents = fs.readFileSync('/mnt/iso/in-image.txt', 'utf-8');
console.log(contents);
```
