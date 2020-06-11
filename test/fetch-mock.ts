interface assertFunc {
  (url: RequestInfo, init?: RequestInit): void;
}

export class FetchMock {
  private url: string;
  private response: Response;
  private assert?: assertFunc;

  constructor() {
    this.url = "";
    this.response = this.createResponse(false, 500, "Internal Server Error");
  }

  fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
    const actualRequest = url.toString();
    expect(actualRequest).toBe(this.url);
    if (this.assert) this.assert(url, init);
    return Promise.resolve(this.response);
  }

  public mock200<T>(request: string, payloadResponse: T | undefined = undefined): void {
    this.url = request;
    this.response = this.createResponse(true, 200, "Success", payloadResponse);
  }

  public mock201<T>(request: string, payloadResponse: T | undefined = undefined): void {
    this.url = request;
    this.response = this.createResponse(true, 201, "Created", payloadResponse);
  }

  public mock204<T>(request: string): void {
    this.url = request;
    this.response = this.createResponse(true, 204, "No Content");
  }

  public assertRequest(func: assertFunc): void {
    this.assert = func;
  }

  private createResponse<T>(
    ok: boolean,
    status: number,
    statusText: string,
    payloadResponse: T | undefined = undefined,
  ): Response {
    const content = payloadResponse ? JSON.stringify({ value: payloadResponse }) : "0";

    const response: Response = {
      headers: new Headers(),
      ok,
      redirected: false,
      status,
      statusText,
      trailer: Promise.resolve(new Headers()),
      type: "basic",
      url: "",
      clone: () => response,
      text: () => Promise.resolve(content),
      body: null,
      bodyUsed: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob([])),
      formData: () => Promise.resolve(new FormData()),
      json: () => Promise.resolve(payloadResponse),
    };
    return response;
  }
}
