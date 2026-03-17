"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/store/auth-store";
import { refreshAccessToken, chat } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  API_URL.replace(/\/api\/?$/, "").replace(/^https?/, (m) =>
    m === "https" ? "wss" : "ws"
  );

export interface ChatMessage {
  username: string;
  text: string;
}

export function useChatSocket() {
  const token = useAuthStore((s) => s.accessToken);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const historyLoadedRef = useRef(false);

  const sendMessage = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "chat_message", text }));
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const loadHistory = async () => {
      if (historyLoadedRef.current) return;
      historyLoadedRef.current = true;
      try {
        const res = await chat.getMessages("lobby", 50);
        if (res.ok) {
          const data = await res.json();
          setMessages(
            data.map((m: { username: string; text: string }) => ({
              username: m.username,
              text: m.text,
            }))
          );
        }
      } catch {
        historyLoadedRef.current = false;
      }
    };

    const connect = async () => {
      let authToken = token;
      if (!authToken) authToken = await refreshAccessToken();
      if (!authToken) return;

      loadHistory();

      const ws = new WebSocket(
        `${WS_URL}/ws/chat/lobby/?token=${encodeURIComponent(authToken)}`
      );

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "chat_message" && data.username && data.text) {
            setMessages((m) => [...m, { username: data.username, text: data.text }]);
          }
        } catch {
          // ignore
        }
      };

      wsRef.current = ws;
      return () => {
        ws.close();
        wsRef.current = null;
      };
    };

    connect();
  }, [token]);

  return { messages, sendMessage, connected };
}
