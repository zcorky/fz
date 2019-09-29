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

## Supported features

- url parameter is automatically serialized
- post data submission method is simplified
- response return processing simplification
- api timeout support
- api request cache support
- support for processing gbk
- request and response interceptor support like axios
- unified error handling
- middleware support
- cancel request support like axios
- make http request from node.js

## fz vs umi-request vs fetch vs axios

| Features | fz | umi-request | fetch | axios |
| :---------- | :---- | :-------------- | :-------------- | :-------------- |
| implementation | Browser native support | Browser native support | Browser native support | XMLHttpRequest |
| size | 3.4k | 9k | 4k (polyfill) | 14k |
| query simplification | ✅ | ✅ | ❎ | ✅ |
| params simplification | ✅ | ❎ | ❎ | ❎ |
| post simplification | ✅ | ✅ | ❎ | ❎ |
| timeout | ✅ | ✅ | ❎ | ✅ |
| cache | ❎ | ✅ | ❎ | ❎ |
| error Check | ✅ | ✅ | ❎ | ❎ |
| error Handling | ❎ | ✅ | ❎ | ✅ |
| interceptor | ✅ | ✅ | ❎ | ✅ |
| prefix | ✅ | ✅ | ❎ | ❎ |
| suffix | ✅ | ✅ | ❎ | ❎ |
| processing gbk | ❎ | ✅ | ❎ | ❎ |
| middleware | ✅ | ✅ | ❎ | ❎ |
| cancel request | ❎ | ✅ | ❎ | ✅ |

For more discussion, refer to [Traditional Ajax is dead, Fetch eternal life](https://github.com/camsong/blog/issues/2) If you have good suggestions and needs, please mention [issue](https://github.com/zcorky/fz/issues)

## TODO Welcome pr

- [x] Test case coverage 85%+
- [x] write a document
- [x] CI integration
- [x] release configuration
- [x] typescript

### Relatived
* [ky](https://github.com/sindresorhus/ky) - Tiny and elegant HTTP client based on the browser Fetch API

## License

MIT © [Moeover](https://moeover.com)