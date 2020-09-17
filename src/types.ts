export interface IFZ {
  // response
  response(): Promise<Response | null>;
  text(): Promise<string | null>;
  json<T extends object>(): Promise<T | null>;
  // formData(): Promise<FormData>
  arrayBuffer(): Promise<ArrayBuffer | null>;
  blob(): Promise<Blob | null>;
}

export interface Option {
  url: Url;
  method?: Method;
  query?: Record<string, any>;
  params?: Record<string, any>;
  body?: Record<string, any>;
  credentials?: Credentials;
  headers?: Record<string, string>;
  engine?: Fetch;
  retry?: number;
  timeout?: number;
  prefix?: string;
  suffix?: string;
  hooks?: Hooks;
  throwHttpErrors?: boolean;
}

export type Url = string;

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'HEAD' | 'DELETE';

export type Credentials = 'same-origin' | 'include';

export interface Hooks {
  beforeRequest: BeforeRequest[]
  afterResponse: AfterResponse[]
}

export type BeforeRequest = (options: Option) => Promise<void>;
export type AfterResponse = (response: Response, options: Option) => Promise<void>;

export const enum ResponseTypes {
  json = 'json',
  text = 'text',
  formData = 'formData',
  arrayBuffer = 'arrayBuffer',
  blob = 'blob',
};

export type Fetch = (input?: string | Request | undefined, init?: RequestInit | undefined) => Promise<Response>