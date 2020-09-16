import * as ismorphicFetch from 'isomorphic-fetch';

// bug
//  => window.fetch.call({}, '/api')
//  =>  Failed to execute 'fetch' on 'Window': Illegal invocation
// export const fetch = ismorphicFetch;

const hasFetch = () => typeof window !== 'undefined'  && !!window.fetch;

export const fetch = hasFetch() ? window.fetch.bind(window) : ismorphicFetch;