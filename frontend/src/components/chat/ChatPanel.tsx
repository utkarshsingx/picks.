"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { useChatSocket } from "@/hooks/useChatSocket";

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, connected } = useChatSocket();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-card shadow-xl">
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <h2 className="font-semibold">Chat</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {connected ? "No messages yet. Say hello!" : "Connecting..."}
            </p>
          ) : (
            <div className="space-y-2">
              {messages.map((m, i) => (
                <div key={i} className="rounded-lg bg-muted p-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {m.username}
                  </p>
                  <p className="text-sm">{m.text}</p>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form
          className="flex gap-2 border-t border-border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              sendMessage(input.trim());
              setInput("");
            }
          }}
        >
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!connected}
          />
          <Button type="submit" disabled={!connected || !input.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
