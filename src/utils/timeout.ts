// import { delay } from '@zcorky/delay';
import { RequestConfig } from '..';
import { TimeoutError } from './error';

// export type Timeout = <T = any>(promise: Promise<T>, ms: number) => Promise<T>;

export const timeout = async <T = any>(promise: Promise<T>, ms: number, context?: { request: RequestConfig }): Promise<T> => {
  let it: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve, reject) => {
    it = setTimeout(() => reject(new TimeoutError(context?.request)), ms)
  });

  const res = await Promise
    .race<Promise<T>>([
      promise,
      timeoutPromise,
    ]);

  clearTimeout(it!);
  return res;
};
