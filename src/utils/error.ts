export type ICode = string | number;
export type IMessage = string;

export interface CodeMessage {
  code: ICode;
  message: IMessage;
}

export class TimeoutError extends Error {
  constructor() {
    super('Request timeout');

    this.name = 'TimeoutError';
  }
}

export class HTTPError extends Error {
  // public response: Response;
  public code: ICode;
  // public message: IMessage;

  constructor(public status: number, public codeMessage: CodeMessage, public response: Response) {
    super(codeMessage.message || response.statusText);

    this.name = 'HTTPError';
    this.status = status;
    this.code = codeMessage.code;
    // this.message = codeMessage.message;
    this.response = response;
  }
}
