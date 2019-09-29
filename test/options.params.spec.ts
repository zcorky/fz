const chai = require('chai');
const spies = require('chai-spies');

chai.use(spies);
const expect = chai.expect;

import * as createTestServer from 'create-test-server';
import fetch, { Headers } from 'node-fetch';

import { fz } from '../src';

describe('option.params', () => {
  let server;

  before(async () => {
    server = await createTestServer();
    server.get('/:id', (request, response) => {
      response.json(request.params);
    });

    server.post('/:id', (request, response) => {
      response.json(request.params);
    });

    server.patch('/:id', (request, response) => {
      response.json(request.params);
    });
    server.put('/:id', (request, response) => {
      response.json(request.params);
    });

    server.delete('/:id', (request, response) => {
      response.json(request.params);
    });
  });

  ['get', 'post', 'put', 'patch', 'delete'].forEach((method) => {
    it(`${method.toUpperCase()} with params`, async () => {
      const params = { id: '666' };
      expect(await fz[method](server.url + '/:id', { params }).json())
        .to.be.deep.equal(params);
    });
  });

  ['get', 'post', 'put', 'patch', 'delete'].forEach((method) => {
    it(`${method.toUpperCase()} with params, all params will be string, number`, async () => {
      const params = { id: 666 };
      expect(await fz[method](server.url + '/:id', { params }).json())
        .to.be.deep.equal({ id: '666' });
    });
  });

  ['get', 'post', 'put', 'patch', 'delete'].forEach((method) => {
    it(`${method.toUpperCase()} with params, all params will be string, boolean`, async () => {
      const params = { id: true };
      expect(await fz[method](server.url + '/:id/', { params }).json())
        .to.be.deep.equal({ id: 'true' });
    });
  });
});
