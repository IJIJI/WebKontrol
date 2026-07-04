const API_BASE = "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ErrorResponse = { error?: string }; // TODO: App wide and more fields?

async function request<T = void>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);

  if (!res.ok) {
    let message = `${init?.method ?? "GET"} ${path} failed: ${res.status}`;
    try {
      const body: ErrorResponse = (await res.json()) as ErrorResponse; // TODO: Response type assignment
      if (body?.error) message = body.error;
    } catch {
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {
        /* empty */
      }
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as T;
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
} satisfies HeadersInit;

export const Api = {
  get<T>(path: string, init?: RequestInit): Promise<T> {
    return request<T>(path, init);
  },

  post<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
    return request<T>(path, {
      ...init,
      method: "POST",
      headers: { ...JSON_HEADERS, ...init?.headers },
      body: JSON.stringify(body),
    });
  },

  put<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
    return request<T>(path, {
      ...init,
      method: "PUT",
      headers: { ...JSON_HEADERS, ...init?.headers },
      body: JSON.stringify(body),
    });
  },

  patch<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
    return request<T>(path, {
      ...init,
      method: "PATCH",
      headers: { ...JSON_HEADERS, ...init?.headers },
      body: JSON.stringify(body),
    });
  },

  delete<T = void>(path: string, init?: RequestInit): Promise<T> {
    return request<T>(path, { ...init, method: "DELETE" });
  },
};
