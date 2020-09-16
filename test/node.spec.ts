const chai = require('chai');
const spies = require('chai-spies');

chai.use(spies);
const expect = chai.expect;

import * as createTestServer from 'create-test-server';
import fetch, { Headers } from 'node-fetch';

import { fz, BeforeRequest, AfterResponse } from '../src';
import { Hooks } from '../src/types';
import { HTTPError, TimeoutError } from '../src/utils';

// (global as any).window = {};
// (global as any).window.fetch = fetch;
// (global as any).window.Headers = Headers;

describe('node server side', () => {
  describe('method', () => {
    let server;

    before(async () => {
      server = await createTestServer();
      server.get('/', (request, response) => {
        response.end(request.method);
      });

      server.post('/', (request, response) => {
        response.end(request.method);
      });

      server.patch('/', (request, response) => {
        response.end(request.method);
      });
      server.put('/', (request, response) => {
        response.end(request.method);
      });

      server.delete('/', (request, response) => {
        response.end(request.method);
      });

      server.head('/', (request, response) => {
        response.end(request.method);
      });
    });

    ['get', 'post', 'put', 'patch', 'delete', 'head'].forEach((method) => {
      it(method, async () => {
        expect((await fz[method](server.url).text()).toLowerCase())
          .to.be.equal(method === 'head' ? '' : method);
      });
    });
  });

  describe('response type', () => {
    let server;
    before(async () => {
      server = await createTestServer();
      server.get('/', (request, response) => {
        if (request.headers.accept.indexOf('json') !== -1) {
          response.setHeader('content-type', 'application/json');
          response.end(JSON.stringify({ body: 'json' }));
        } else {
          response.end('text');
        }
      });
      return server;
    });

    it('response', async () => {
      expect(await fz.get(server.url).response()).to.be.have.property('status');
    });

    it('text', async () => {
      expect(await fz.get(server.url).text()).to.be.equal('text');
    });

    it('json', async () => {
      expect(await fz.get(server.url).json()).to.deep.equal({ body: 'json' });
    });

    // it('formData', async () => {
    //   try {
    //     console.log('xx: ', await fz.get(server.url).formData());
    //   } catch (e) {
    //     console.log('xx: ', e);
    //   }
    //   expect(await fz.get(server.url).formData()).to.throw;
    // });

    // it('arrayBuffer', async () => {
    //   expect(await fz.get(server.url).arrayBuffer()).to.throw; /* tslint:disable-line */
    // });

    // it('blob', async () => {
    //   expect(await fz.get(server.url).blob()).to.throw; /* tslint:disable-line */
    // });
  });

  describe('execption', () => {
    let server;
    before(async () => {
      server = await createTestServer();
      server.get('/', (request, response) => {
        setTimeout(() => response.end('timeout'), 100);
      });
      server.post('/', (request, response) => {
        response.statusCode = request.body.code;
        response.end();
      })
    });

    it('timeout', async () => {
      try {
        await fz.get(server.url, { timeout: 1, retry: 2 }).text();
      } catch (e) {
        expect(e instanceof TimeoutError).to.be.equal(true);
      }
    });

    it('http: 400(Bad Request)', async () => {
      try {
        // const r = await fz.post(server.url).response();
        // console.log('fz: ', { s: r.status, st: r.statusText, ok: r.ok});
        await fz.post(server.url, { body: { code: 400 } }).text();
      } catch (e) {
        expect(e instanceof HTTPError).to.be.equal(true);
        expect(e.response.statusText).to.be.equal('Bad Request');
        // const r = e.response;
        // console.log('fz e: ', { s: r.status, st: r.statusText, ok: r.ok});
      }
    });

    it('http: 403(Forbidden)', async () => {
      try {
        await fz.post(server.url, { body: { code: 403 } }).text();
      } catch (e) {
        expect(e instanceof HTTPError).to.be.equal(true);
        expect(e.response.statusText).to.be.equal('Forbidden');
      }
    });

    it('http: 408(Request Timeout)', async () => {
      try {
        await fz.post(server.url, { body: { code: 408 } }).text();
      } catch (e) {
        expect(e instanceof HTTPError).to.be.equal(true);
        expect(e.response.statusText).to.be.equal('Request Timeout');
      }
    });

    it('http: 413(Payload Too Large)', async () => {
      try {
        await fz.post(server.url, { body: { code: 413 } }).text();
      } catch (e) {
        expect(e instanceof HTTPError).to.be.equal(true);
        expect(e.response.statusText).to.be.equal('Payload Too Large');
      }
    });

    it('http: 429(Too Many Requests)', async () => {
      try {
        await fz.post(server.url, { body: { code: 429 } }).text();
      } catch (e) {
        expect(e instanceof HTTPError).to.be.equal(true);
        expect(e.response.statusText).to.be.equal('Too Many Requests');
      }
    });

    it('http: 500(Internal Server Error)', async () => {
      try {
        await fz.post(server.url, { body: { code: 500 } }).text();
      } catch (e) {
        expect(e instanceof HTTPError).to.be.equal(true);
        expect(e.response.statusText).to.be.equal('Internal Server Error');
      }
    });

    it('http: 502(Bad Gateway)', async () => {
      try {
        await fz.post(server.url, { body: { code: 502 } }).text();
      } catch (e) {
        expect(e instanceof HTTPError).to.be.equal(true);
        expect(e.response.statusText).to.be.equal('Bad Gateway');
      }
    });

    it('http: 503(Service Unavailable)', async () => {
      try {
        await fz.post(server.url, { body: { code: 503 } }).text();
      } catch (e) {
        expect(e instanceof HTTPError).to.be.equal(true);
        expect(e.response.statusText).to.be.equal('Service Unavailable');
      }
    });

    it('http: 504(Gateway Timeout)', async () => {
      try {
        await fz.post(server.url, { body: { code: 504 } }).text();
      } catch (e) {
        expect(e instanceof HTTPError).to.be.equal(true);
        expect(e.response.statusText).to.be.equal('Gateway Timeout');
      }
    });
  });

  describe('options', () => {
    it('engine', () => {
      expect((fz.get('/', { engine: fetch as any }) as any).engine).to.be.equal(fetch);
    });

    it('timeout', () => {
      expect((fz.get('/', { timeout: 1 }) as any).timeout).to.be.equal(1);
    });

    it('retry', () => {
      expect((fz.get('/', { retry: 1 }) as any).retryCount).to.be.equal(1);
    });

    it('hooks', () => {
      const hooks: Hooks = {
        beforeRequest: [],
        afterResponse: [],
      };
      expect((fz.get('/', { hooks }) as any).hooks).to.be.equal(hooks);
    });

    it('method', () => {
      expect((fz.get('/') as any).fetchOptions.method).to.be.equal('GET');
    });

    it('json', () => {
      const headers = { 'content-type': 'application/json' };
      expect((fz.get('/', { headers }) as any).fetchOptions.headers).to.be.equal(headers);
    });

    it('json', () => {
      const body = { body: 'json' };
      expect((fz.post('/', { body }) as any).fetchOptions.body).to.be.equal(JSON.stringify(body));
    });
  });

  describe('hooks', () => {
    let server;
    const hooks: Hooks = {
      beforeRequest: [async options => {
        expect(options.method).to.be.equal('GET');
      }],
      afterResponse: [async response => {
        expect(response.status).to.be.equal(200);
      }],
    };

    before(async () => {
      server = await createTestServer();
      server.get('/', (request, response) => {
        setTimeout(() => response.end('timeout'), 100);
      });
      return server;
    });

    it('beforeRequest', async () => {
      await fz.get(server.url, { hooks }).text();
    });

    it('afterResponse', async () => {
      await fz.get(server.url, { hooks }).text();
    });
  });

  describe('retry', () => {
    let server;
    beforeEach(async () => {
      server = await createTestServer();
      server.spy = chai.spy();
      server.get('/', (request, response) => {
        server.spy();

        setTimeout(() => response.end('timeout'), 1000);
      });
    });

    // afterEach(() => {
    //   spy.restore
    // });

    it('default 0', async () => {
      try {
        await fz.get(server.url, { timeout: 100 }).text();
      } catch (e) {
        expect(server.spy).to.have.been.called.once; /* tslint:disable-line */
      }
    });

    it('once', async () => {
      try {
        await fz.get(server.url, { timeout: 100, retry: 1 }).text();
      } catch (e) {
        expect(server.spy).to.have.been.called.twice; /* tslint:disable-line */
      }
    });

    it('twice', async () => {
      try {
        await fz.get(server.url, { timeout: 100, retry: 2 }).text();
      } catch (e) {
        expect(server.spy).to.have.been.called.exactly(3);
      }
    });

    it('five', async () => {
      try {
        await fz.get(server.url, { timeout: 100, retry: 5 }).text();
      } catch (e) {
        expect(server.spy).to.have.been.called.exactly(6);
      }
    });
  })
});
