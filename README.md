# fz

[![NPM version](https://img.shields.io/npm/v/@zcorky/fz.svg?style=flat)](https://www.npmjs.com/package/@zcorky/fz)
[![Coverage Status](https://img.shields.io/coveralls/zcorky/fz.svg?style=flat)](https://coveralls.io/r/zcorky/fz)
[![Dependencies](https://david-dm.org/@zcorky/fz/status.svg)](https://david-dm.org/@zcorky/fz)
[![Build Status](https://travis-ci.com/zcorky/fz.svg?branch=master)](https://travis-ci.com/zcorky/fz)
![license](https://img.shields.io/github/license/zcorky/fz.svg)
[![issues](https://img.shields.io/github/issues/zcorky/fz.svg)](https://github.com/zcorky/fz/issues)

> A simply http client lib base fetch

## Install

```
$ npm install @zcorky/fz
```

## Usage

```js
// typescript
import fz from '@zcorky/fz';

(async () => {
	const json = await fz.post('https://some-api.com', {json: {foo: true}}).json();

	console.log(json);
	//=> `{data: '🦄'}`
})();
```

## API

### fz.get(input, [options])
### fz.post(input, [options])
### fz.put(input, [options])
### fz.patch(input, [options])
### fz.head(input, [options])
### fz.delete(input, [options])

### Relatived
* [ky](https://github.com/sindresorhus/ky) - Tiny and elegant HTTP client based on the browser Fetch API

## License

MIT © [Moeover](https://moeover.com)