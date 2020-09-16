
import { delay } from '@zcorky/delay';
import * as fetch from 'isomorphic-fetch';

export type TimeoutErrorType = typeof TimeoutError;
export type HTTPErrorType = typeof HTTPError;

export type Timeout = (promise: Promise<any>, ms: number) => Promise<any>;
export type Condition = (error: HTTPErrorType | TimeoutErrorType | Error) => boolean;
export type Retry = (fn: Function, count: number, condition: Condition) => Promise<any>;

export class TimeoutError extends Error {
  constructor() {
    super('Request timeout');
    
    this.name = 'TimeoutError';
  }
}

export const timeout: Timeout = (promise, ms) => Promise.race([
  promise,
  (async () => {
    await delay(ms);
    throw new TimeoutError();
  })(),
]);

export class HTTPError extends Error {
  // public response: Response;

  constructor(public response: Response) {
    super(response.statusText);
    this.name = 'HTTPError';
    // this.response = response;
  }
}

export type RetryFn = ((...args: any[]) => Promise<any>) | Function;

export const retry: Retry = (fn: RetryFn, times = 0, condition: Condition) => {
  let runtimes = 0;

  const next = async (): Promise<any> => {
    try {
      return await (fn as (...args: any[]) => Promise<any>)();
    } catch (error) {
      if (condition(error) && runtimes < times ) {
        runtimes++;
        await delay(1000);
        return next();
      }

      throw error;
    }
  }

  return next();
}

const hasFetch = () => typeof window !== 'undefined'  && window.fetch;

export const isomorphicEngine = () => {
  return hasFetch() ? window.fetch.bind(window) : fetch
};