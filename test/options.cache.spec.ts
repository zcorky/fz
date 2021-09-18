import * as createTestServer from 'create-test-server';
import { delay } from '@zcorky/delay';

import { fz } from '../src';

describe('option.cache', () => {
  let server;

  beforeEach(async () => {
    server = await createTestServer();
    server.get('/cache', (request, response) => {
      response.json({
        random: '' + Math.random(),
      });
    });
  });

  afterEach(async () => {
    await server.close();
  });

  it(`cache: true`, async () => {
    const value = await fz.get(server.url + '/cache', { cache: true }).json();
    const value2 = await fz.get(server.url + '/cache', { cache: true }).json();
    const value3 = await fz.get(server.url + '/cache', { cache: true }).json();

    expect(value).toEqual(value2);
    expect(value).toEqual(value3);

    for (let i = 0; i < 100; ++i) {
      const v = await fz.get(server.url + '/cache', { cache: true }).json();
      expect(value).toEqual(v);
    }

    const values = await Promise.all(
      '*'.repeat(100).split('*').map(() => fz.get(server.url + '/cache', { cache: true }).json()),
    );

    // console.log('value:', value, values.slice(0, 10));

    expect(value).toEqual(values[99]);
    expect(values[0]).toEqual(values[99]);
  });

  it(`cache: maxAge = 100`, async () => {
    const value = await fz.get(server.url + '/cache', { cache: { maxAge: 100 } }).json();
    const value2 = await fz.get(server.url + '/cache', { cache: { maxAge: 100 } }).json();
    const value3 = await fz.get(server.url + '/cache', { cache: { maxAge: 100 } }).json();

    expect(value).toEqual(value2);
    expect(value).toEqual(value3);

    for (let i = 0; i < 100; ++i) {
      const v = await fz.get(server.url + '/cache', { cache: { maxAge: 100 } }).json();
      expect(value).toEqual(v);
    }

    const values = await Promise.all(
      '*'.repeat(100).split('*').map(() => fz.get(server.url + '/cache', { cache: { maxAge: 100 } }).json()),
    );

    // console.log('value:', value, values.slice(0, 10));

    expect(value).toEqual(values[99]);
    expect(values[0]).toEqual(values[99]);

    await delay(101);

    const value4 = await fz.get(server.url + '/cache', { cache: { maxAge: 100 } }).json();
    const value5 = await fz.get(server.url + '/cache', { cache: { maxAge: 100 } }).json();
    const value6 = await fz.get(server.url + '/cache', { cache: { maxAge: 100 } }).json();
    console.log('value:', value, value4, value5, value6);

    expect(value.random).not.toEqual(value4.random);
    expect(value.random).not.toEqual(value5.random);
    expect(value.random).not.toEqual(value6.random);
    expect(value4.random).toEqual(value5.random);
    expect(value4.random).toEqual(value6.random);
    expect(value5.random).toEqual(value6.random);
  });
});
