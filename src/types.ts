export interface IFZ {
  // response
  response(): Promise<Response | null>;
  text(): Promise<string | null>;
  json<T = any>(): Promise<T | null>;
  // formData(): Promise<FormData>
  arrayBuffer(): Promise<ArrayBuffer | null>;
  blob(): Promise<Blob | null>;
}

export interface Options {
  url: Url;
  method?: Method;
  query?: Record<string, any>;
  params?: Record<string, any>;
  body?: Record<string, any> | FormData;
  credentials?: Credentials;
  headers?: Record<string, string>;
  engine?: Fetch;
  retry?: number;
  timeout?: number;
  prefix?: string;
  suffix?: string;
  hooks?: Hooks;
  throwHttpErrors?: boolean;
  cache?: boolean | ICacheOptions;
}

export interface ICacheOptions {
  maxAge?: number;
}

export type Url = string;

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'HEAD' | 'DELETE';

export type Credentials = 'same-origin' | 'include';

export interface Hooks {
  beforeRequest: BeforeRequest[]
  afterResponse: AfterResponse[]
}

export type BeforeRequest = (options: Options) => Promise<void>;
export type AfterResponse = (response: Response, options: Options) => Promise<void>;

export const enum ResponseTypes {
  json = 'json',
  text = 'text',
  formData = 'formData',
  arrayBuffer = 'arrayBuffer',
  blob = 'blob',
};

export type Fetch = (input?: string | Request | undefined, init?: RequestInit | undefined) => Promise<Response>;

export type StatusCode = 400 | 401 | 403 | 404 | 405 | 429 | 500 | 502 | 503 | 504

export type StatusHandler = AfterResponse;
