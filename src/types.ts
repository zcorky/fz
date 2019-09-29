export interface FZ {
  // response
  response(): Promise<Response>;
  text(): Promise<string>;
  json<T extends object>(): Promise<T>;
  // formData(): Promise<FormData>
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
}

export interface Option {
  method?: Method;
  query?: Record<string, any>;
  params?: Record<string, any>;
  body?: Record<string, any>;
  credentials?: Credentials;
  headers?: Record<string, string>;
  engine?: Fetch;
  retry?: number;
  timeout?: number;
  hooks?: Hooks;
  throwHttpErrors?: boolean
}

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'HEAD' | 'DELETE';

export type Credentials = 'same-origin' | 'include';

export interface Hooks {
  beforeRequest: BeforeRequest[]
  afterResponse: AfterResponse[]
}

type BeforeRequest = (options?: Option) => void
type AfterResponse = (response?: Response) => void

export type Input = string

export const enum ResponseTypes {
  json = 'json',
  text = 'text',
  formData = 'formData',
  arrayBuffer = 'arrayBuffer',
  blob = 'blob',
};

export type Fetch = (input?: string | Request | undefined, init?: RequestInit | undefined) => Promise<Response>