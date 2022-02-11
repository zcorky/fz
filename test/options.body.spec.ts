import * as createTestServer from 'create-test-server';

import { fz } from '../src';

describe('option.body', () => {
  let server;

  beforeEach(async () => {
    server = await createTestServer();
    server.get('/', (request, response) => {
      response.json(request.body);
    });

    server.post('/', (request, response) => {
      response.json(request.body);
    });

    server.patch('/', (request, response) => {
      response.json(request.body);
    });
    server.put('/', (request, response) => {
      response.json(request.body);
    });

    server.delete('/', (request, response) => {
      response.json(request.body);
    });
  });

  afterEach(async () => {
    await server.close();
  });

  ['post', 'put', 'patch', 'delete'].forEach((method) => {
    it(`${method.toUpperCase()} with body`, async () => {
      const body = { id: '666' };
      expect(await fz[method](server.url, { body }).json())
        .toEqual(body);
    });
  });

  // ['get', 'post', 'put', 'patch', 'delete'].forEach((method) => {
  //   it(`${method.toUpperCase()} with params, all params will be string, number`, async () => {
  //     const params = { id: 666 };
  //     expect(await fz[method](server.url, { params }).json())
  //       .toEqual({ id: '666' });
  //   });
  // });

  // ['get', 'post', 'put', 'patch', 'delete'].forEach((method) => {
  //   it(`${method.toUpperCase()} with params, all params will be string, boolean`, async () => {
  //     const params = { flag: true, flag2: false };
  //     expect(await fz[method](server.url, { params }).json())
  //       .toEqual({ flag: 'true', flag2: 'false'  });
  //   });
  // });

  it('expect x-form-url-encoded', async () => {
    const response = await fz
      .post('https://httpbin.zcorky.com/post', {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: {
          'hi': 'zero'
        },
      })
      .json();

      expect(response.headers['content-type']).toBe('application/x-www-form-urlencoded');
      expect(response.body.hi).toBe('zero');
  });
});
