import * as createTestServer from 'create-test-server';
import fetch, { Headers } from 'node-fetch';

import { fz } from '../src';
import { Hooks } from '../src/types';
import { HTTPError, TimeoutError } from '../src/utils';

(global as any).window = {};
(global as any).window.fetch = fetch;
(global as any).window.Headers = Headers;

describe('option.query', () => {
  let server;

  beforeEach(async () => {
    server = await createTestServer();
    server.get('/', (request, response) => {
      response.json(request.query);
    });

    server.post('/', (request, response) => {
      response.json(request.query);
    });

    server.patch('/', (request, response) => {
      response.json(request.query);
    });
    server.put('/', (request, response) => {
      response.json(request.query);
    });

    server.delete('/', (request, response) => {
      response.json(request.query);
    });
  });

  afterEach(async () => {
    await server.close();
  });

  ['get', 'post', 'put', 'patch', 'delete'].forEach((method) => {
    it(`${method.toUpperCase()} with query`, async () => {
      const query = { id: '666' };
      expect(await fz[method](server.url, { query }).json())
        .toEqual(query);
    });
  });

  ['get', 'post', 'put', 'patch', 'delete'].forEach((method) => {
    it(`${method.toUpperCase()} with query, all query will be string, number`, async () => {
      const query = { id: 666 };
      expect(await fz[method](server.url, { query }).json())
        .toEqual({ id: '666' });
    });
  });

  ['get', 'post', 'put', 'patch', 'delete'].forEach((method) => {
    it(`${method.toUpperCase()} with query, all query will be string, boolean`, async () => {
      const query = { flag: true, flag2: false };
      expect(await fz[method](server.url, { query }).json())
        .toEqual({ flag: 'true', flag2: 'false'  });
    });
  });
});
