"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/store/auth-store";
import { refreshAccessToken } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  API_URL.replace(/\/api\/?$/, "").replace(/^https?/, (m) => (m === "https" ? "wss" : "ws"));

export interface CrashSocketState {
  multiplier: number;
  status: "betting" | "running" | "crashed";
  crashPoint: number | null;
  roundId: string | null;
  connected: boolean;
  error: string | null;
}

export function useCrashSocket(roundId: string | null) {
  const token = useAuthStore((s) => s.accessToken);
  const [state, setState] = useState<CrashSocketState>({
    multiplier: 1,
    status: "betting",
    crashPoint: null,
    roundId: null,
    connected: false,
    error: null,
  });
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectCountRef = useRef(0);

  const connect = useCallback(() => {
    if (!roundId) return;

    const doConnect = async () => {
      let authToken = token;
      if (!authToken) {
        authToken = await refreshAccessToken();
      }
      if (!authToken) return;

      connectCountRef.current += 1;
      const url = `${WS_URL}/ws/crash/${roundId}/?token=${encodeURIComponent(authToken)}`;
      const ws = new WebSocket(url);

      const timeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      }, 8000);

      ws.onopen = () => {
        clearTimeout(timeout);
        setState((s) => ({ ...s, connected: true, error: null }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case "multiplier_update":
              setState((s) => ({
                ...s,
                multiplier: data.multiplier ?? 1,
                status: "running",
              }));
              break;
            case "round_started":
              setState((s) => ({
                ...s,
                multiplier: 1,
                status: "running",
              }));
              break;
            case "round_crashed":
              setState((s) => ({
                ...s,
                status: "crashed",
                crashPoint: parseFloat(data.crash_point ?? 0),
              }));
              break;
            case "round_betting":
              setState((s) => ({
                ...s,
                multiplier: 1,
                status: "betting",
                roundId: data.round_id ?? roundId,
              }));
              break;
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        clearTimeout(timeout);
        setState((s) => {
          if (s.status !== "crashed") {
            reconnectRef.current = setTimeout(doConnect, 2000);
          }
          return { ...s, connected: false };
        });
        wsRef.current = null;
      };

      ws.onerror = () => {
        setState((s) => ({ ...s, error: "WebSocket error" }));
      };

      wsRef.current = ws;
    };

    doConnect();
  }, [roundId, token]);

  useEffect(() => {
    if (!roundId) return;

    connect();

    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [roundId, connect]);

  const reconnect = useCallback(() => {
    if (reconnectRef.current) clearTimeout(reconnectRef.current);
    setState((s) => ({ ...s, error: null }));
    connect();
  }, [connect]);

  const updateRound = (roundId: string) => {
    setState((s) => ({ ...s, roundId, multiplier: 1, status: "betting", crashPoint: null }));
  };

  return { ...state, reconnect, updateRound };
}
