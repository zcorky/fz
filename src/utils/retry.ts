import { delay } from '@zcorky/delay';
import { HTTPError, TimeoutError } from './error';

export type TimeoutErrorType = typeof TimeoutError;
export type HTTPErrorType = typeof HTTPError;

export type Condition = (error: HTTPErrorType | TimeoutErrorType | Error) => boolean;
export type Retry = (fn: Function, count: number, condition: Condition) => Promise<any>;

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