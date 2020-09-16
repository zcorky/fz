export class TimeoutError extends Error {
  constructor() {
    super('Request timeout');

    this.name = 'TimeoutError';
  }
}

export class HTTPError extends Error {
  // public response: Response;

  constructor(public response: Response) {
    super(response.statusText);
    
    this.name = 'HTTPError';
    this.response = response;
  }
}