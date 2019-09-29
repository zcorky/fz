import { FZ, Input, Option, Hooks, ResponseTypes, Fetch } from './types';
import { isomorphicEngine, timeout, retry, HTTPError, TimeoutError } from './utils';

export class fz implements FZ {
  // request
  public static get(input: Input, option?: Option): FZ {
    return new fz(input, { ...option, method: 'GET' });
  }
  public static post(input: Input, option?: Option): FZ {
    return new fz(input, { ...option, method: 'POST' });
  }
  public static put(input: Input, option?: Option): FZ {
    return new fz(input, { ...option, method: 'PUT' });
  }
  public static patch(input: Input, option?: Option): FZ {
    return new fz(input, { ...option, method: 'PATCH' });
  }
  public static head(input: Input, option?: Option): FZ {
    return new fz(input, { ...option, method: 'HEAD' });
  }

  public static delete(input: Input, option?: Option): FZ {
    return new fz(input, { ...option, method: 'DELETE' });
  }

  private _response: Response | null = null;

  private engine: Fetch
  private timeout: number;
  private retryCount: number;
  private hooks: Hooks;
  private fetchOptions: Option = {};

  constructor(private input: Input, private options: Option) {
    // this._response = 123 as any; // @TODO should remove
    this.engine = options.engine || isomorphicEngine() as any;
    this.timeout = options.timeout || 30000;
    this.retryCount = options.retry || 0;
    this.hooks = options.hooks || {
      beforeRequest: [],
      afterResponse: [],
    };

    this.fetchOptions = {
      method: options.method,
      headers: options.headers || {},
    };

    if (this.options.json) {
      (this.fetchOptions as any).headers['content-type'] = 'application/json';
      (this.fetchOptions as any).body = JSON.stringify(this.options.json);
    }
  }

  public async response(): Promise<Response> {
    return await this.fetch();
  }

  public async text(): Promise<string> {
    return this.getResponse<string>(ResponseTypes.text);
  }

  public async json<T extends object>(): Promise<T> {
    (this.fetchOptions as any).headers['accept'] = 'application/json';

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

export default fz;
