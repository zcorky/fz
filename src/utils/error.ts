import { FZResponse, RequestConfig } from '../types';

export type ICode = string | number;
export type IMessage = string;

export interface CodeMessage {
  code: ICode;
  message: IMessage;
}

export class TimeoutError extends Error {
  constructor(public request?: RequestConfig) {
    super('Request timeout');

    this.name = 'TimeoutError';
    this.stack = (new Error()).stack;

    this.request = request;
  }
}

export class HTTPError extends Error {
  // public response: Response;
  public code: ICode;
  // public message: IMessage;

  constructor(public status: number, public codeMessage: CodeMessage, public response: FZResponse, public request: RequestConfig) {
    super(codeMessage.message || response.statusText);

    this.name = 'HTTPError';
    // Catch stack:
    //   https://stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript
    this.stack = (new Error()).stack;

    this.status = status;
    this.code = codeMessage.code;
    // this.message = codeMessage.message;
    this.response = response;
    this.request = request;
  }
}
