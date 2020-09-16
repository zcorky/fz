export type MimeType = 'application/json' | 'multipart/form-data' | 'application/x-www-form-urlencoded';

export class Headers {
  private _headers: Record<string, any>;

  constructor(rawHeaders: Record<string, any> = {}) {
    this._headers = Object
      .keys(rawHeaders)
      .reduce((all, key) => {
        all[this.getKey(key)] = rawHeaders[key];

        return all;
      }, {} as Record<string, any>);
  }

  public get(key: string) {
    return this._headers[this.getKey(key)] || null;
  }

  public set(key: string, value: string) {
    return this._headers[this.getKey(key)] = value;
  }

  public has(key: string) {
    return this.getKey(key) in this._headers;
  }

  public delete(key: string) {
    delete this._headers[this.getKey(key)];
  }

  public toObject() {
    return {
      ...this._headers,
      'content-type': this.contentType,
    };
  }

  public toJSON() {
    return this.toObject();
  }

  public get contentType(): string {
    return this.get('content-type') || 'application/json';
  }

  public get isContentTypeJSON() {
    return this.isContentType('application/json');
  }

  public get isContentTypeForm() {
    return this.isContentType('multipart/form-data');
  }

  public get isContentTypeUrlencoded() {
    return this.isContentType('application/x-www-form-urlencoded');
  }

  private getKey(key: any) {
    return String(key).toLowerCase();
  }

  private include(parent: string, child: string) {
    return parent.indexOf(child) !== -1;
  }

  private isContentType(mimeType: MimeType) {
    return this.include(this.contentType, mimeType);
  }
}

