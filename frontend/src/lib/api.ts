import { useAuthStore } from "@/store/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function getStoredToken(): string | null {
  return useAuthStore.getState().accessToken;
}

function getStoredRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken;
}

export async function refreshAccessToken(): Promise<string | null> {
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
  vaultMove: (currency: string, amount: number, direction: "to_vault" | "from_vault") =>
    api.post("/wallets/vault/move/", { currency, amount, direction }),
};

export const games = {
  diceBet: (amount: number, currency: string, direction: "over" | "under", target: number) =>
    api.post("/games/dice/bet/", { amount, currency, direction, target }),
  minesStart: (amount: number, currency: string, mineCount?: number) =>
    api.post("/games/mines/start/", { amount, currency, mine_count: mineCount ?? 5 }),
  minesReveal: (betId: number, tileIndex: number) =>
    api.post("/games/mines/reveal/", { bet_id: betId, tile_index: tileIndex }),
  minesCashout: (betId: number) =>
    api.post("/games/mines/cashout/", { bet_id: betId }),
  plinkoBet: (amount: number, currency: string, risk: "low" | "medium" | "high") =>
    api.post("/games/plinko/bet/", { amount, currency, risk }),
  crashBet: (amount: number, currency: string, roundId: string) =>
    api.post("/games/crash/bet/", { amount, currency, round_id: roundId }),
  crashCashout: (betId: number, multiplier?: number) =>
    api.post("/games/crash/cashout/", { bet_id: betId, multiplier }),
  getCrashRounds: (limit?: number) =>
    api.get("/games/crash/rounds/" + (limit ? `?limit=${limit}` : "")),
  getCrashRound: (roundId: string) => api.get(`/games/crash/rounds/${roundId}/`),
  getBets: (params?: Record<string, string | number> | string) => {
    if (typeof params === "string") {
      const url = new URL(params);
      const path = url.pathname.replace(/^\/api/, "") + url.search;
      return apiFetch(path || "/games/bets/");
    }
    const search =
      params && Object.keys(params).length
        ? "?" +
          new URLSearchParams(
            Object.fromEntries(
              Object.entries(params)
                .filter(([, v]) => v != null && v !== "")
                .map(([k, v]) => [k, String(v)])
            )
          ).toString()
        : "";
    return apiFetch("/games/bets/" + search);
  },
};

export const kyc = {
  getDocuments: () => api.get("/kyc/documents/"),
  getStatus: () => api.get("/kyc/status/"),
  uploadDocument: (file: File, documentType: string) => {
    const formData = new FormData();
    formData.append("document_type", documentType);
    formData.append("file", file);
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(
      `${API_URL}/kyc/documents/`,
      {
        method: "POST",
        headers,
        body: formData,
      }
    );
  },
};

export const chat = {
  getMessages: (room = "lobby", limit = 50) =>
    api.get(`/chat/messages/?room=${encodeURIComponent(room)}&limit=${limit}`),
};

export const sports = {
  getSports: () => api.get("/sports/"),
  search: (q: string) =>
    api.get(`/sports/search/?q=${encodeURIComponent(q)}`),
  getEvents: (sportKey: string, includeOdds?: boolean) =>
    api.get(
      `/sports/${sportKey}/events/` +
        (includeOdds ? "?include_odds=true" : "")
    ),
  getEventOdds: (sportKey: string, eventId: string) =>
    api.get(`/sports/${sportKey}/events/${eventId}/odds/`),
  placeBet: (params: {
    amount: number;
    currency: string;
    event_id: string;
    sport_key: string;
    market_key: string;
    outcome_name: string;
    odds: number;
    home_team?: string;
    away_team?: string;
    outcome_point?: number;
  }) => api.post("/sports/bet/", params),
  getBets: (params?: Record<string, string>) =>
    apiFetch(
      "/sports/bets/" +
        (params && Object.keys(params).length
          ? "?" + new URLSearchParams(params).toString()
          : "")
    ),
};
