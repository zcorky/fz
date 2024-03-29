import * as createTestServer from 'create-test-server';

import { fz } from '../src';

describe('option.prefix', () => {
  let server;

  beforeEach(async () => {
    server = await createTestServer();
    server.get('/prefix/namespace', (request, response) => {
      response.json(request.body);
    });

    server.post('/prefix/namespace', (request, response) => {
      response.json(request.body);
    });

    server.patch('/prefix/namespace', (request, response) => {
      response.json(request.body);
    });
    server.put('/prefix/namespace', (request, response) => {
      response.json(request.body);
    });

    server.delete('/prefix/namespace', (request, response) => {
      response.json(request.body);
    });
  });

  afterEach(async () => {
    await server.close();
  });

  ['post', 'put', 'patch', 'delete'].forEach((method) => {
    it(`${method.toUpperCase()} with body`, async () => {
      const body = { id: '666' };
      expect(await fz[method]('/namespace', { body, prefix: server.url + '/prefix' }).json())
        .toEqual(body);
    });
  });
});
