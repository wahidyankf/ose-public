import { setWorldConstructor, World } from "@cucumber/cucumber";

export interface HttpResponse {
  readonly status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly body: any;
  readonly headers: Record<string, string>;
}

export class CustomWorld extends World {
  public baseUrl: string = "http://localhost:8201";
  public response: HttpResponse | null = null;
  public tokens: Map<string, string> = new Map();
  public userIds: Map<string, string> = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public context: Record<string, any> = {};

  async get(path: string, token?: string): Promise<HttpResponse> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${this.baseUrl}${path}`, { headers });
    const body = await res.json().catch(() => null);
    return {
      status: res.status,
      body,
      headers: Object.fromEntries(res.headers.entries()),
    };
  }

  async post(
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any,
    token?: string,
  ): Promise<HttpResponse> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const responseBody = await res.json().catch(() => null);
    return {
      status: res.status,
      body: responseBody,
      headers: Object.fromEntries(res.headers.entries()),
    };
  }

  async patch(
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any,
    token?: string,
  ): Promise<HttpResponse> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    const responseBody = await res.json().catch(() => null);
    return {
      status: res.status,
      body: responseBody,
      headers: Object.fromEntries(res.headers.entries()),
    };
  }

  async put(
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any,
    token?: string,
  ): Promise<HttpResponse> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    const responseBody = await res.json().catch(() => null);
    return {
      status: res.status,
      body: responseBody,
      headers: Object.fromEntries(res.headers.entries()),
    };
  }

  async delete(path: string, token?: string): Promise<HttpResponse> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "DELETE",
      headers,
    });
    const responseBody = await res.json().catch(() => null);
    return {
      status: res.status,
      body: responseBody,
      headers: Object.fromEntries(res.headers.entries()),
    };
  }
}

setWorldConstructor(CustomWorld);
