import { add } from '@zcorky/query-string/lib/add';
import * as qs from '@zcorky/query-string';

import { IFZ, Url, Option, Hooks, ResponseTypes, Fetch } from '../types';
import { fetch, timeout, retry, HTTPError, TimeoutError, Headers } from '../utils';

export class Fz implements IFZ {
  public static request(option: Option): IFZ {
    return new Fz(option);
  }

  // methods
  public static get(url: Url, option?: Option): IFZ {
    return Fz.request({ ...option, url, method: 'GET' });
  }

  public static post(url: Url, option?: Option): IFZ {
    return Fz.request({ ...option, url, method: 'POST' });
  }

  public static put(url: Url, option?: Option): IFZ {
    return Fz.request({ ...option, url, method: 'PUT' });
  }

  public static patch(url: Url, option?: Option): IFZ {
    return Fz.request({ ...option, url, method: 'PATCH' });
  }

  public static head(url: Url, option?: Option): IFZ {
    return Fz.request({ ...option, url, method: 'HEAD' });
  }

  public static delete(url: Url, option?: Option): IFZ {
    return Fz.request({ ...option, url, method: 'DELETE' });
  }

  public static fetch(url: Url, option: Option): IFZ {
    return Fz.request({ ...option, url });
  }

  private _response: Response | null = null;

  private engine: Fetch;
  private timeout: number;
  private retryCount: number;
  private hooks: Hooks;
  private fetchOptions: Omit<Option, 'headers' | 'body'> & { body?: string, headers?: Headers } = {} as any;

  constructor(private readonly options: Option) {
    this.engine = options.engine || fetch as any;
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

    this.applyPrefix();
    this.applySuffix();
    this.applyQuery();
    this.applyParams();
    this.applyHeader();
    this.applyBody();
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

  private applyBody() {
    const body = this.options.body;
    const headers = this.fetchOptions.headers!;
    
    if (body) {
      if (headers.isContentTypeJSON) {
        this.fetchOptions.body = JSON.stringify(body);
      } else if (headers.isContentTypeUrlencoded) {
        this.fetchOptions.body = qs.stringify(body || {});
      } else if (headers.isContentTypeForm){
        // isContentTypeForm form-data
      } else {
        // fallback json
        this.fetchOptions.body = JSON.stringify(body);
      }
    }
  }

  private applyHeader() {
    this.fetchOptions.headers = new Headers(this.options.headers);
  }

  public async response(): Promise<Response> {
    return await this.fetch();
  }

  public async text() {
    return this.getResponse<string>(ResponseTypes.text);
  }

  public async json<T extends object>() {
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

  private async request(): Promise<Response> {
    await this.beforeRequest(this.fetchOptions as any);
    const { headers, ...rest } = this.fetchOptions;
    const finalOptions = { ...rest, headers: headers!.toObject() };

    return await timeout(this.engine.call(this, this.fetchOptions.url, finalOptions), this.timeout);
  }

  private async getResponse<T>(type: string): Promise<T | null> {
    return this.retry(async () => {
      const response =  await this.request();

      // response
      this._response = response;

      if (!response.ok) {
        throw new HTTPError(response);
      }

      await this.afterResponse(response);

      try {
        return await (response.clone() as any)[type]();
      } catch (err) {
        return null;
      }
    });
  }

  private async retry(fn: Function) {
    return retry(fn, this.retryCount, (error) => {
      if (error instanceof HTTPError || error instanceof TimeoutError) {
        return true;
      }

      return false;
    })
  }

  private async beforeRequest(options: Option) {
    for (const hook of this.hooks.beforeRequest) {
      await hook(options);
    }
  }

  private async afterResponse(response: Response) {
    for (const hook of this.hooks.afterResponse) {
      await hook(response, this.options);
    }
  }
}
