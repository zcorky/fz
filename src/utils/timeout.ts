import { delay } from '@zcorky/delay';
import { TimeoutError } from './error';

export type Timeout = (promise: Promise<any>, ms: number) => Promise<any>;

export const timeout: Timeout = (promise, ms) => Promise.race([
  promise,
  (async () => {
    await delay(ms);
    throw new TimeoutError();
  })(),
]);
