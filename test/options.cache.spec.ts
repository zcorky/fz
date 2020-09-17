const chai = require('chai');
const spies = require('chai-spies');

chai.use(spies);
const expect = chai.expect;

import * as createTestServer from 'create-test-server';
import { delay } from '@zcorky/delay';

import { fz } from '../src';

describe('option.cache', () => {
  let server;

  before(async () => {
    server = await createTestServer();
    server.get('/cache', (request, response) => {
      response.json({
        random: '' + Math.random(),
      });
    });
  });

  it(`cache: true`, async () => {
    const value = await fz.get(server.url + '/cache', { cache: true }).json();
    const value2 = await fz.get(server.url + '/cache', { cache: true }).json();
    const value3 = await fz.get(server.url + '/cache', { cache: true }).json();

    expect(value).to.be.deep.equal(value2);
    expect(value).to.be.deep.equal(value3);

    for (let i = 0; i < 100; ++i) {
      const v = await fz.get(server.url + '/cache', { cache: true }).json();
      expect(value).to.be.deep.equal(v);
    }

    const values = await Promise.all(
      '*'.repeat(100).split('*').map(() => fz.get(server.url + '/cache', { cache: true }).json()),
    );

    // console.log('value:', value, values.slice(0, 10));

    expect(value).to.be.deep.equal(values[99]);
    expect(values[0]).to.be.deep.equal(values[99]);
  });

  it(`cache: maxAge = 100`, async () => {
    const value = await fz.get(server.url + '/cache', { cache: { maxAge: 100 } }).json();
    const value2 = await fz.get(server.url + '/cache', { cache: { maxAge: 100 } }).json();
    const value3 = await fz.get(server.url + '/cache', { cache: { maxAge: 100 } }).json();

    expect(value).to.be.deep.equal(value2);
    expect(value).to.be.deep.equal(value3);

    for (let i = 0; i < 100; ++i) {
      const v = await fz.get(server.url + '/cache', { cache: { maxAge: 100 } }).json();
      expect(value).to.be.deep.equal(v);
    }

    const values = await Promise.all(
      '*'.repeat(100).split('*').map(() => fz.get(server.url + '/cache', { cache: { maxAge: 100 } }).json()),
    );

    // console.log('value:', value, values.slice(0, 10));

    expect(value).to.be.deep.equal(values[99]);
    expect(values[0]).to.be.deep.equal(values[99]);

    await delay(101);

    const value4 = await fz.get(server.url + '/cache', { cache: { maxAge: 100 } }).json();
    const value5 = await fz.get(server.url + '/cache', { cache: { maxAge: 100 } }).json();
    const value6 = await fz.get(server.url + '/cache', { cache: { maxAge: 100 } }).json();
    console.log('value:', value, value4, value5, value6);

    expect(value.random).to.be.not.equal(value4.random);
    expect(value.random).to.be.not.equal(value5.random);
    expect(value.random).to.be.not.equal(value6.random);
    expect(value4.random).to.be.equal(value5.random);
    expect(value4.random).to.be.equal(value6.random);
    expect(value5.random).to.be.equal(value6.random);
  });
});
