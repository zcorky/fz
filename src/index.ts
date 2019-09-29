import { add } from '@zcorky/query-string/lib/add';
import { stringify } from '@zcorky/query-string';
import { IFZ, Input, Option, Hooks, ResponseTypes, Fetch } from './types';
import { isomorphicEngine, timeout, retry, HTTPError, TimeoutError } from './utils';

export class Fz implements IFZ {
  // request
  public static get(input: Input, option?: Option): IFZ {
    return new Fz(input, { ...option, method: 'GET' });
  }
  public static post(input: Input, option?: Option): IFZ {
    return new Fz(input, { ...option, method: 'POST' });
  }
  public static put(input: Input, option?: Option): IFZ {
    return new Fz(input, { ...option, method: 'PUT' });
  }
  public static patch(input: Input, option?: Option): IFZ {
    return new Fz(input, { ...option, method: 'PATCH' });
  }
  public static head(input: Input, option?: Option): IFZ {
    return new Fz(input, { ...option, method: 'HEAD' });
  }

  public static delete(input: Input, option?: Option): IFZ {
    return new Fz(input, { ...option, method: 'DELETE' });
  }

  private _response: Response | null = null;

  private engine: Fetch
  private timeout: number;
  private retryCount: number;
  private hooks: Hooks;
  private fetchOptions: Omit<Option, 'body'> & { body?: string } = {} as any;

  constructor(private input: Input, private readonly options: Option) {
    this.engine = options.engine || isomorphicEngine() as any;
    this.timeout = options.timeout || 30000;
    this.retryCount = options.retry || 0;
    this.hooks = options.hooks || {
      beforeRequest: [],
      afterResponse: [],
    };

    this.fetchOptions = {
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
      this.input = `${this.options.prefix}${this.input}`;
    }
  }

  private applySuffix() {
    if (this.options.suffix) {
      this.input = `${this.input}${this.options.suffix}`;
    }
  }

  private applyQuery() {
    const query = this.options.query;
    if (query) {
      // @TODO
      const index = this.input.indexOf('?');
      if (index !== -1) {
        this.input = `${this.input.slice(0, index)}?${add(this.input.slice(index), query)}`
      } else {
        this.input = `${this.input}?${stringify(query)}`
      }
    }
  }

  private applyParams() {
    const params = this.options.params;
    if (params) {
      // @TODO
      this.input = this.input.replace(/\/:([^\/$]+)/g, (_, key) => {
        return `/${params && params[key] || ''}`;
      });
    }
  }

  private applyBody() {
    const body = this.options.body;
    if (body) {
      this.fetchOptions.headers!['content-type'] = 'application/json';
      this.fetchOptions.body = JSON.stringify(body);
    }
  }

  private applyHeader() {
    this.fetchOptions.headers = this.options.headers || {};
  }

  public async response(): Promise<Response> {
    return await this.fetch();
  }

  public async text(): Promise<string> {
    return this.getResponse<string>(ResponseTypes.text);
  }

  public async json<T extends object>(): Promise<T> {
    this.fetchOptions.headers!['accept'] = 'application/json';

    return this.getResponse<T>(ResponseTypes.json);
  }

  // async formData(): Promise<FormData> {
  //   return this.getResponse<FormData>(ResponseTypes.formData);
  // }

  public async arrayBuffer(): Promise<ArrayBuffer> {
    return this.getResponse<ArrayBuffer>(ResponseTypes.arrayBuffer);
  }

  public async blob(): Promise<Blob> {
    return this.getResponse<Blob>(ResponseTypes.blob);
  }

  private async fetch(): Promise<Response> {
    await this.beforeRequest(this.fetchOptions);
    return timeout(this.engine(this.input, this.fetchOptions), this.timeout);
  }

  private async getResponse<T>(type: string): Promise<T> {
    return this.retry(async () => {
      const response =  await this.fetch();

      // response
      this._response = response;

      if (!response.ok) {
        throw new HTTPError(response);
      }

      await this.afterResponse(response);
      return (response.clone() as any)[type]();
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
      await hook(response);
    }
  }
}

export const fz = Fz;

export default Fz;
