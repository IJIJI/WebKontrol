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

// Two shapes exist server-side: `error` for a message, `errors` for a zod issue tree on a
// 400. Without the second, a rejected body showed the bare "POST /x failed: 400".
type ErrorResponse = { error?: string; errors?: unknown }; // TODO: App wide and more fields?

/** The first message a zod error tree carries, so a 400 says which field was wrong. */
function firstIssue(errors: unknown, path: string[] = []): string | null {
  if (errors === null || typeof errors !== "object") return null;
  const node = errors as { _errors?: unknown; [key: string]: unknown };
  if (Array.isArray(node._errors) && typeof node._errors[0] === "string")
    return path.length === 0 ? node._errors[0] : `${path.join(".")}: ${String(node._errors[0])}`;
  for (const [key, value] of Object.entries(node)) {
    if (key === "_errors") continue;
    const found = firstIssue(value, [...path, key]);
    if (found !== null) return found;
  }
  return null;
}

async function request<T = void>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);

  if (!res.ok) {
    let message = `${init?.method ?? "GET"} ${path} failed: ${res.status}`;
    try {
      const body: ErrorResponse = (await res.json()) as ErrorResponse; // TODO: Response type assignment
      if (body?.error) message = body.error;
      else if (body?.errors !== undefined) message = firstIssue(body.errors) ?? message;
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
