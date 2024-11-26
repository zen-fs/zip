# ZenFS Zip Backend (with Case Sensitive Mode option)

[ZenFS](https://github.com/zen-fs/core) backend for Zip files.

Please read the ZenFS documentation!

## Backend

This package adds the `Zip` backend, which allows you to create a _readonly_ file system from a zip file.
For more information, see the [API documentation](https://zen-fs.github.io/zip).

### Fork Information

This fork adds a new option to enable/disable the Case Sensitive mode.

## Usage

> [!NOTE]
> The examples are written in ESM.
> For CJS, you can `require` the package.
> If using a browser environment, you can use a `<script>` with `type=module` (you may need to use import maps)

You can't use `Zip` on its own. You must import the core in order to use the backend.

```js
import { configure, fs } from '@zenfs/core';
import { Zip } from '@zenfs/zip';

const res = await fetch('http://example.com/archive.zip');

await configure({
	mounts: {
		'/mnt/zip': { backend: Zip, data: await res.arrayBuffer(), caseSensitive: false },
	},
});

const contents = fs.readFileSync('/mnt/zip/in-archive.txt', 'utf-8');
console.log(contents);
```
