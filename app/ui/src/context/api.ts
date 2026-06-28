
const API_BASE = '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T = void>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, init)
    if (!res.ok) {
        let message = `${init?.method ?? 'GET'} ${path} failed: ${res.status}`
        try { const body = await res.json(); if (body?.error) message = body.error } catch { /* empty */ }
        throw new Error(message)
    }
    if (res.status === 204) return undefined as T
    return res.json()
}