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

export const wallets = {
  getBalances: () => api.get("/wallets/balances/"),
  getTransactions: (params?: Record<string, string> | string) => {
    if (typeof params === "string") {
      const url = new URL(params);
      const path = url.pathname.replace(/^\/api/, "") + url.search;
      return apiFetch(path || "/wallets/transactions/");
    }
    return apiFetch(
      "/wallets/transactions/" +
        (params && Object.keys(params).length
          ? "?" + new URLSearchParams(params).toString()
          : "")
    );
  },
  depositCrypto: (currency: string, amount_usd: number) =>
    api.post("/wallets/deposit/crypto/", { currency, amount_usd }),
  depositFiat: (amount_usd: number) =>
    api.post("/wallets/deposit/fiat/", { amount_usd }),
  withdraw: (currency: string, amount: number, destination_address?: string) =>
    api.post("/wallets/withdraw/", { currency, amount, destination_address }),
};
