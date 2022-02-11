import { add } from '@zcorky/query-string/lib/add';
import * as qs from '@zcorky/query-string';
import LRU from '@zcorky/lru';
import { urlJoin } from '@zodash/url-join';

import {
  IFZ, Url, FzConfig, ResponseTypes, Fetch,
  Hooks, BeforeRequest, AfterResponse,
  StatusCode, StatusHandler,
  ErrorHandler,
  RequestConfig,
  FZResponse,
} from '../types';
import {
  fetch as DEFAULT_FETCH,
  timeout,
  retry,
  HTTPError,
  TimeoutError,
  Headers,
  isPlainObject,
} from '../utils';

export class Fz implements IFZ {
  public static request(options: FzConfig): IFZ {
    return new Fz(options);
  }

  // methods
  public static get(url: Url, options?: Omit<FzConfig, 'url' | 'body'>): IFZ {
    return Fz.request({ ...options, url, method: 'GET' });
  }

  public static post(url: Url, options?: Omit<FzConfig, 'url' | 'retry'>): IFZ {
    return Fz.request({ ...options, url, method: 'POST' });
  }

  public static put(url: Url, options?: Omit<FzConfig, 'url' | 'retry'>): IFZ {
    return Fz.request({ ...options, url, method: 'PUT' });
  }

  public static patch(url: Url, options?: Omit<FzConfig, 'url' | 'retry'>): IFZ {
    return Fz.request({ ...options, url, method: 'PATCH' });
  }

  public static head(url: Url, options?: Omit<FzConfig, 'url' | 'retry'>): IFZ {
    return Fz.request({ ...options, url, method: 'HEAD' });
  }

  public static delete(url: Url, options?: Omit<FzConfig, 'url' | 'retry'>): IFZ {
    return Fz.request({ ...options, url, method: 'DELETE' });
  }

  public static fetch(url: Url, options: Omit<FzConfig, 'url'>): IFZ {
    return Fz.request({ ...options, url });
  }

  public static baseUrl(url: string) {
    Fz._BASE_URL = url;
  }

  public static headers(hs: Record<string, string>) {
    Fz._HEADERS = hs;
  }

  public static status(statusCode: StatusCode, handler: StatusHandler) {
    if (!Fz._STATUS[statusCode]) {
      Fz._STATUS[statusCode] = [];
    }

    Fz._STATUS[statusCode].push(handler);
  }

  public static loading(start: BeforeRequest, end: AfterResponse) {
    Fz._LOADING.start = start;
    Fz._LOADING.end = end;
  }

  public static error(handler: ErrorHandler) {
    Fz._ERROR_HANDLER = handler;
  }

  public static enableShowLoading() {
    Fz._DEFAULT_SHOW_LOADING = true;
  }

  public static beforeRequest(handler: BeforeRequest) {
    Fz._HOOKS.beforeRequest.push(handler);
  }

  public static afterResponse(handler: AfterResponse) {
    Fz._HOOKS.afterResponse.push(handler);
  }

  public static onBadRequest(handler: StatusHandler) {
    Fz.status(400, handler);
  }

  public static onUnauthorized(handler: StatusHandler) {
    Fz.status(401, handler);
  }

  public static onForbidden(handler: StatusHandler) {
    Fz.status(403, handler);
  }

  public static onNotFound(handler: StatusHandler) {
    Fz.status(404, handler);
  }

  public static onMethodNotAllowed(handler: StatusHandler) {
    Fz.status(405, handler);
  }

  public static onRateLimited(handler: StatusHandler) {
    Fz.status(429, handler);
  }

  public static onInternalServerError(handler: StatusHandler) {
    Fz.status(500, handler);
  }

  public static onBadGateway(handler: StatusHandler) {
    Fz.status(502, handler);
  }

  public static onServiceUnavailable(handler: StatusHandler) {
    Fz.status(503, handler);
  }

  public static onGatewayTimeout(handler: StatusHandler) {
    Fz.status(504, handler);
  }

  public static engine(customEngine: Fetch) {
    Fz._ENGINE = customEngine;
  }

  private static _CACHE: LRU<string, any> = null as any;
  private static _STATUS: Record<StatusCode, StatusHandler[]> = {} as any;
  private static _LOADING: { start: BeforeRequest, end: AfterResponse } = {} as any;
  private static _DEFAULT_SHOW_LOADING = false;
  private static _HOOKS: Hooks = {
    beforeRequest: [],
    afterResponse: [],
  };
  private static _BASE_URL = '';
  private static _HEADERS: Record<string, string> = {};
  private static _ERROR_HANDLER: ErrorHandler;
  private static _ENGINE: Fetch = null as any;

  private engine: Fetch;
  private showLoading: boolean;
  private timeout: number;
  private retryCount: number;
  private hooks: Hooks;
  private requestConfig: RequestConfig = {} as any;

  constructor(private readonly config: FzConfig) {
    this.engine = config.engine || Fz._ENGINE || DEFAULT_FETCH as any;
    this.showLoading = typeof config.showLoading === 'undefined' ? Fz._DEFAULT_SHOW_LOADING : config.showLoading;
    this.timeout = config.timeout || 30000;
    this.retryCount = config.retry || 0;
    this.hooks = config.hooks || {
      beforeRequest: [],
      afterResponse: [],
    };

    this.requestConfig = {
      url: config.url,
      method: config.method,
    };

    if (config.agent) {
      this.requestConfig.agent = config.agent;
    }

    // loading
    this.applyLoading();

    // url
    this.applyPrefix();
    this.applySuffix();
    this.applyQuery();
    this.applyParams();
    this.applyBaseUrl();

    // headers
    this.applyHeader();

    // body
    this.applyBody();

    // cache
    this.applyCache();

    // status
    this.applyStatus();
  }

  private applyLoading() {
    if (Fz._LOADING.start && this.showLoading) {
      this.hooks.beforeRequest.push(Fz._LOADING.start);
    }

    if (Fz._LOADING.end && this.showLoading) {
      this.hooks.afterResponse.push(Fz._LOADING.end);
    }
  }

  private applyPrefix() {
    if (this.config.prefix) {
      this.requestConfig.url = `${this.config.prefix}${this.requestConfig.url}`;
    }
  }

  private applySuffix() {
    if (this.config.suffix) {
      this.requestConfig.url = `${this.requestConfig.url}${this.config.suffix}`;
    }
  }

  private applyQuery() {
    const query = this.config.query;
    if (query && Object.keys(query).length > 0) {
      // @TODO
      const index = this.requestConfig.url.indexOf('?');
      if (index !== -1) {
        this.requestConfig.url = `${this.requestConfig.url.slice(0, index)}?${add(this.requestConfig.url.slice(index), query)}`
      } else {
        this.requestConfig.url = `${this.requestConfig.url}?${qs.stringify(query)}`
      }
    }
  }

  private applyParams() {
    const params = this.config.params;
    if (params) {
      // @TODO
      this.requestConfig.url = this.requestConfig.url.replace(/\/:([^\/$]+)/g, (_, key) => {
        return `/${params && params[key] || ''}`;
      });
    }
  }

  private applyBaseUrl() {
    if (Fz._BASE_URL) {
      this.requestConfig.url = urlJoin(Fz._BASE_URL, this.requestConfig.url);
    }
  }

  private applyHeader() {
    // @1 global
    const headers = this.requestConfig.headers = new Headers(Fz._HEADERS);

    // @2 options
    const optionHeaders = this.config.headers;
    for (const key in optionHeaders) {
      // override
      headers.set(key, optionHeaders[key]);
    }

    // if (isPlainObject(this.config.body)) {
    //   headers.set('content-type', 'application/json');
    // }
  }

  private applyBody() {
    const body = this.config.body;
    const headers = this.requestConfig.headers!;

    if (!body) return;
    // already encoded
    if (typeof body !== 'object') {
      this.requestConfig.body = body as any as string;
      return;
    }

    if (headers.isContentTypeJSON) {
      this.requestConfig.body = JSON.stringify(body);
    } else if (headers.isContentTypeUrlencoded) {
      this.requestConfig.body = qs.stringify(body as any);
    } else if (headers.isContentTypeForm) {
      this.requestConfig.body = body as any;
    } else {
      this.requestConfig.body = body as any;
    }
  }

  private applyCache() {
    if (this.config.cache) {
      Fz._CACHE = Fz._CACHE || new LRU();
    }
  }

  private applyStatus() {
    const _sh = Fz._STATUS;

    const af: AfterResponse = async (response, options) => {
      const status = response.status;
      const handlers = _sh[status] || [];

      for (const handler of handlers) {
        await handler.call(this, response, options);
      }
    }

    this.hooks.afterResponse.push(af);
  }

  private async request(finalConfig: any): Promise<Response> {
    return await timeout(this.engine.call(this.engine, this.requestConfig.url, finalConfig), this.timeout);
  }

  public async response(): Promise<Response | null> {
    return await this.getResponse();
  }

  public async text() {
    return this.getResponse<string>(ResponseTypes.text);
  }

  public async json<T extends any>() {
    this.requestConfig.headers!.set('accept', 'application/json');

    return this.getResponse<T>(ResponseTypes.json);
  }

  // async formData(): Promise<FormData> {
  //   return this.getResponse<FormData>(ResponseTypes.formData);
  // }

  public async arrayBuffer(): Promise<ArrayBuffer | null> {
    return this.getResponse<ArrayBuffer>(ResponseTypes.arrayBuffer);
  }

  public async blob(): Promise<Blob | null> {
    return this.getResponse<Blob>(ResponseTypes.blob);
  }

  private async getResponse<T>(type?: ResponseTypes): Promise<T | null> {
    await this.beforeRequest(this.requestConfig as any);

    const { headers, ...rest } = this.requestConfig;

    const finalConfig = {
      ...rest,
      headers: headers!.toObject(),
    };

    const retryPromise = this.retry(async () => {
      const cachedResponse = await this.getCachedResponse(finalConfig);
      if (cachedResponse) {
        await this.afterResponse(cachedResponse);
        return cachedResponse;
      }

      const _response = await this.request(finalConfig);
      const response: FZResponse = {
        status: _response.status,
        statusText: _response.statusText,
        headers: _response.headers as any, // @TODO
        data: null,
      };

      if (!_response.ok) {
        response.data = await _response.text();

        try {
          response.data = JSON.parse(response.data);
        } catch (error: any) {
          //
        }

        this.runStatusBeforeError(response);

        throw new HTTPError(
          response.status,
          {
            code: response.data?.code,
            message: response.data?.message,
          },
          response,
          this.requestConfig,
        );
      }

      if (!type) {
        // response.data = _response;

        // return response;
        return _response;
      }

      try {
        response.data = await (_response as any)[type]();
      } catch (err: any) {
        throw err;
      }

      await this.setCachedResponse(finalConfig, response.data);

      await this.afterResponse(response);

      return response.data;
    });

    try {
      return await retryPromise;
    } catch (error: any) {
      if (Fz._LOADING.end) {
        await Fz._LOADING.end(error.response, this.config);
      }

      if (Fz._ERROR_HANDLER) {
        const notThrow = await Fz._ERROR_HANDLER(error);
        if (notThrow) {
          return null as any;
        }
      }

      throw error;
    }
  }

  private async retry(fn: Function) {
    return retry(fn, this.retryCount, (error) => {
      if (error instanceof HTTPError || error instanceof TimeoutError) {
        return true;
      }

      return false;
    })
  }

  private async beforeRequest(options: FzConfig) {
    for (const hook of this.hooks.beforeRequest) {
      await hook(options);
    }
  }

  private async afterResponse(response: FZResponse) {
    for (const hook of this.hooks.afterResponse) {
      await hook(response, this.config);
    }
  }

  private async getCachedResponse(options: any): Promise<FZResponse | null> {
    if (!this.config.cache) {
      return null;
    }

    const key = await this.getCachedKey(options);
    return Fz._CACHE.get(key);
  }

  private async setCachedResponse(options: any, response: FZResponse) {
    if (!this.config.cache) {
      return;
    }

    const key = await this.getCachedKey(options);

    if (typeof this.config.cache === 'boolean') {
      return Fz._CACHE.set(key, response);
    }

    return Fz._CACHE.set(key, response, {
      maxAge: this.config.cache?.maxAge!,
    });
  }

  private async getCachedKey(options: any) {
    return JSON.stringify(options);
  }

  private async runStatusBeforeError(response: FZResponse) {
    const _sh = Fz._STATUS;

    const af: AfterResponse = async (response, options) => {
      const status = response.status;
      const handlers = _sh[status] || [];

      for (const handler of handlers) {
        await handler.call(this, response, options);
      }
    }

    return af(response, this.config);
  }
}
