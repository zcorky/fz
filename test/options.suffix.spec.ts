const chai = require('chai');
const spies = require('chai-spies');

chai.use(spies);
const expect = chai.expect;

import * as createTestServer from 'create-test-server';

import { fz } from '../src';

describe('option.suffix', () => {
  let server;

  before(async () => {
    server = await createTestServer();
    server.get('/prefix/namespace.json', (request, response) => {
      response.json(request.body);
    });

    server.post('/prefix/namespace.json', (request, response) => {
      response.json(request.body);
    });

    server.patch('/prefix/namespace.json', (request, response) => {
      response.json(request.body);
    });
    server.put('/prefix/namespace.json', (request, response) => {
      response.json(request.body);
    });

    server.delete('/prefix/namespace.json', (request, response) => {
      response.json(request.body);
    });

  });

  ['post', 'put', 'patch', 'delete'].forEach((method) => {
    it(`${method.toUpperCase()} with body`, async () => {
      const body = { id: '666' };
      expect(await fz[method]('/namespace', { body, prefix: server.url + '/prefix', suffix: '.json' }).json())
        .to.be.deep.equal(body);
    });
  });
});
