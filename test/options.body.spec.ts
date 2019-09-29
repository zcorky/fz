const chai = require('chai');
const spies = require('chai-spies');

chai.use(spies);
const expect = chai.expect;

import * as createTestServer from 'create-test-server';

import { fz } from '../src';

describe('option.body', () => {
  let server;

  before(async () => {
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

  ['post', 'put', 'patch', 'delete'].forEach((method) => {
    it(`${method.toUpperCase()} with body`, async () => {
      const body = { id: '666' };
      expect(await fz[method](server.url, { body }).json())
        .to.be.deep.equal(body);
    });
  });

  // ['get', 'post', 'put', 'patch', 'delete'].forEach((method) => {
  //   it(`${method.toUpperCase()} with params, all params will be string, number`, async () => {
  //     const params = { id: 666 };
  //     expect(await fz[method](server.url, { params }).json())
  //       .to.be.deep.equal({ id: '666' });
  //   });
  // });

  // ['get', 'post', 'put', 'patch', 'delete'].forEach((method) => {
  //   it(`${method.toUpperCase()} with params, all params will be string, boolean`, async () => {
  //     const params = { flag: true, flag2: false };
  //     expect(await fz[method](server.url, { params }).json())
  //       .to.be.deep.equal({ flag: 'true', flag2: 'false'  });
  //   });
  // });
});
