# ZenFS Archive Backends

[ZenFS](https://github.com/zen-fs/core) backends for archive files.

This packages adds a few backends:

- `Zip` allows you to create a _readonly_ file system from a zip file.
- `Iso` allows you to create a _readonly_ file system from a `.iso` file.

For more information, see the [API documentation](https://zenfs.dev/archives).

> [!IMPORTANT]
> Please read the ZenFS core documentation!

## Usage

The easiest way to get started is by looking at these examples


#### `Zip`

```js
import { configure, fs } from '@zenfs/core';
import { Zip } from '@zenfs/zip';

const res = await fetch('http://example.com/archive.zip');

await configure({
	mounts: {
		'/mnt/zip': { backend: Zip, data: await res.arrayBuffer() },
	},
});

const contents = fs.readFileSync('/mnt/zip/in-archive.txt', 'utf-8');
console.log(contents);
```

#### `Iso`

```js
import { configure, fs } from '@zenfs/core';
import { Iso } from '@zenfs/iso';

const res = await fetch('http://example.com/image.iso');

await configure({
	mounts: {
		'/mnt/iso': { backend: Iso, data: new Uint8Array(await res.arrayBuffer()) },
	},
});

const contents = fs.readFileSync('/mnt/iso/in-image.txt', 'utf-8');
console.log(contents);
```

#### Note

The `Iso` implementation uses information on the ISO9660/ECMA119 standards from:

-   https://wiki.osdev.org/ISO_9660
-   https://www.ecma-international.org/wp-content/uploads/ECMA-119_4th_edition_june_2019.pdf
