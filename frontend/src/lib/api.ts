import { useAuthStore } from "@/store/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function getStoredToken(): string | null {
  return useAuthStore.getState().accessToken;
}

function getStoredRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken;
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getStoredRefreshToken();
  if (!refresh) return null;
  const res = await fetch(`${API_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const newAccess = data.access ?? null;
  if (newAccess) useAuthStore.getState().setTokens(newAccess);
  return newAccess;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = getStoredToken();
  if (!token) {
    token = await refreshAccessToken();
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  let res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
      });
    }
  }
  return res;
}

export const api = {
  post: (path: string, body: unknown) =>
    apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
  get: (path: string) => apiFetch(path),
  put: (path: string, body: unknown) =>
    apiFetch(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch(path, { method: "DELETE" }),
};
