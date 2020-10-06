import { add } from '@zcorky/query-string/lib/add';
import * as qs from '@zcorky/query-string';
import LRU from '@zcorky/lru';
import { urlJoin } from '@zodash/url-join';

import {
  IFZ, Url, Options, ResponseTypes, Fetch,
  Hooks, BeforeRequest, AfterResponse,
  StatusCode, StatusHandler,
  ErrorHandler,
} from '../types';
import { fetch, timeout, retry, HTTPError, TimeoutError, Headers } from '../utils';

export class Fz implements IFZ {
  public static request(options: Options): IFZ {
    return new Fz(options);
  }

  // methods
  public static get(url: Url, options?: Omit<Options, 'url' | 'body'>): IFZ {
    return Fz.request({ ...options, url, method: 'GET' });
  }

  public static post(url: Url, options?: Omit<Options, 'url' | 'retry'>): IFZ {
    return Fz.request({ ...options, url, method: 'POST' });
  }

  public static put(url: Url, options?: Omit<Options, 'url' | 'retry'>): IFZ {
    return Fz.request({ ...options, url, method: 'PUT' });
  }

  public static patch(url: Url, options?: Omit<Options, 'url' | 'retry'>): IFZ {
    return Fz.request({ ...options, url, method: 'PATCH' });
  }

  public static head(url: Url, options?: Omit<Options, 'url' | 'retry'>): IFZ {
    return Fz.request({ ...options, url, method: 'HEAD' });
  }

  public static delete(url: Url, options?: Omit<Options, 'url' | 'retry'>): IFZ {
    return Fz.request({ ...options, url, method: 'DELETE' });
  }

  public static fetch(url: Url, options: Omit<Options, 'url'>): IFZ {
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

  private engine: Fetch;
  private showLoading: boolean;
  private timeout: number;
  private retryCount: number;
  private hooks: Hooks;
  private fetchOptions: Omit<Options, 'headers' | 'body'> & { body?: string, headers?: Headers } = {} as any;

  constructor(private readonly options: Options) {
    this.engine = options.engine || fetch as any;
    this.showLoading = typeof options.showLoading === 'undefined' ? Fz._DEFAULT_SHOW_LOADING : options.showLoading;
    this.timeout = options.timeout || 30000;
    this.retryCount = options.retry || 0;
    this.hooks = options.hooks || {
      beforeRequest: [],
      afterResponse: [],
    };

    this.fetchOptions = {
      url: options.url,
      method: options.method,
    };

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
    if (this.options.prefix) {
      this.fetchOptions.url = `${this.options.prefix}${this.fetchOptions.url}`;
    }
  }

  private applySuffix() {
    if (this.options.suffix) {
      this.fetchOptions.url = `${this.fetchOptions.url}${this.options.suffix}`;
    }
  }

  private applyQuery() {
    const query = this.options.query;
    if (query) {
      // @TODO
      const index = this.fetchOptions.url.indexOf('?');
      if (index !== -1) {
        this.fetchOptions.url = `${this.fetchOptions.url.slice(0, index)}?${add(this.fetchOptions.url.slice(index), query)}`
      } else {
        this.fetchOptions.url = `${this.fetchOptions.url}?${qs.stringify(query)}`
      }
    }
  }

  private applyParams() {
    const params = this.options.params;
    if (params) {
      // @TODO
      this.fetchOptions.url = this.fetchOptions.url.replace(/\/:([^\/$]+)/g, (_, key) => {
        return `/${params && params[key] || ''}`;
      });
    }
  }

  private applyBaseUrl() {
    if (Fz._BASE_URL) {
      this.fetchOptions.url = urlJoin(Fz._BASE_URL, this.fetchOptions.url);
    }
  }

  private applyHeader() {
    // @1 global
    const headers = this.fetchOptions.headers = new Headers(Fz._HEADERS);

    // @2 options
    const optionHeaders = this.options.headers;
    for (const key in optionHeaders) {
      // override
      headers.set(key, optionHeaders[key]);
    }
  }

  private applyBody() {
    const body = this.options.body;
    const headers = this.fetchOptions.headers!;

    if (body) {
      if (headers.isContentTypeJSON) {
        this.fetchOptions.body = JSON.stringify(body);
      } else if (headers.isContentTypeUrlencoded) {
        this.fetchOptions.body = qs.stringify(body as any || {});
      } else if (headers.isContentTypeForm) {
        // isContentTypeForm form-data
      } else {
        // fallback json
        this.fetchOptions.body = JSON.stringify(body);
      }
    }
  }

  private applyCache() {
    if (this.options.cache) {
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

  private async request(finalOptions: any): Promise<Response> {
    return await timeout(this.engine.call(this, this.fetchOptions.url, finalOptions), this.timeout);
  }

  public async response(): Promise<Response | null> {
    return await this.getResponse();
  }

  public async text() {
    return this.getResponse<string>(ResponseTypes.text);
  }

  public async json<T extends any>() {
    this.fetchOptions.headers!.set('accept', 'application/json');

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
    await this.beforeRequest(this.fetchOptions as any);

    const { headers, ...rest } = this.fetchOptions;

    const finalOptions = {
      ...rest,
      headers: headers!.toObject(),
    };

    const retryPromise = this.retry(async () => {
      let response = await this.getCachedResponse(finalOptions);

      if (!response) {
        response = await this.request(finalOptions);
      }

      if (!response.ok) {
        let data = {} as any;
        try {
          data = await response.clone().json();
        } catch (error) {
          //
        }

        throw new HTTPError(
          response.status,
          {
            code: data?.code,
            message: data?.message,
          },
          response.clone(),
        );
      }

      await this.setCachedResponse(finalOptions, response.clone());

      await this.afterResponse(response.clone());

      if (!type) {
        return response.clone();
      }

      try {
        return await (response.clone() as any)[type]();
      } catch (err) {
        return null;
      }
    });

    try {
      return await retryPromise;
    } catch (error) {
      if (Fz._LOADING.end) {
        await Fz._LOADING.end(error.response, this.options);
      }

      if (Fz._ERROR_HANDLER) {
        await Fz._ERROR_HANDLER(error);
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

  private async beforeRequest(options: Options) {
    for (const hook of this.hooks.beforeRequest) {
      await hook(options);
    }
  }

  private async afterResponse(response: Response) {
    for (const hook of this.hooks.afterResponse) {
      await hook(response, this.options);
    }
  }

  private async getCachedResponse(options: any): Promise<Response | null> {
    if (!this.options.cache) {
      return null;
    }

    const key = await this.getCachedKey(options);
    return Fz._CACHE.get(key);
  }

  private async setCachedResponse(options: any, response: Response) {
    if (!this.options.cache) {
      return ;
    }

    const key = await this.getCachedKey(options);

    if (typeof this.options.cache === 'boolean') {
      return Fz._CACHE.set(key, response);
    }

    return Fz._CACHE.set(key, response, {
      maxAge: this.options.cache?.maxAge!,
    });
  }

  private async getCachedKey(options: any) {
    return JSON.stringify(options);
  }
}
