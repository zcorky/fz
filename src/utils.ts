
import { delay } from '@zcorky/delay';

export type TimeoutErrorType = typeof TimeoutError;
export type HTTPErrorType = typeof HTTPError;

export type Timeout = (promise: Promise<any>, ms: number) => Promise<any>;
export type Condition = (error) => boolean;
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
  public response: Response;

  constructor(response) {
    super(response.statusText);
    this.name = 'HTTPError';
    this.response = response;
  }
}

export const retry: Retry = (fn, times = 0, condition) => {
  let runtimes = 0;

  const next = async () => {
    try {
      return await fn();
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
