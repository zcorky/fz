export { Url, Method, Credentials, Hooks, BeforeRequest, AfterResponse } from './types';
export { Headers, fetch, timeout, retry } from './utils';

import { Fz } from './core';

export const fz = Fz;

export default Fz;
