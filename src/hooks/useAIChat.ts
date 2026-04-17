import { useState, useRef, useCallback } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";

export interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export const SUPABASE_URL = "https://spb-t4n12wh910jns6hr.supabase.opentrust.net";
export const SUPABASE_ANON_KEY =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi10NG4xMndoOTEwam5zNmhyIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzYxODE0OTUsImV4cCI6MjA5MTc1NzQ5NX0.XQ9qSuQ43PTFm5bQ-UZVuYF8ZctY7pKJUUCM5zpfuwk";

const FALLBACK_MESSAGES: Record<string, string> = {
  authentication_error: "认证失败，请刷新页面后重试。",
  rate_limit_error: "请求过于频繁，请稍后再试。",
  invalid_request_error: "请求格式有误，请重试。",
  overloaded_error: "服务繁忙，请稍后再试。",
  insufficient_credits: "AI 额度不足，请联系管理员。",
  permission_error: "AI 功能未启用，请联系管理员。",
  api_error: "服务暂时不可用，请稍后再试。",
};

function getErrorMessage(code: string, backendMsg: string) : string {
  if (backendMsg) return backendMsg;
  return FALLBACK_MESSAGES[code] || "服务暂时不可用，请稍后再试。";
}

export function useAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isLoading) return;

      const userMsg: Message = { role: "user", content };
      const assistantMsg: Message = { role: "assistant", content: "", isStreaming: true };

      // Capture current messages for API call BEFORE state update
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);
      setError(null);

      abortRef.current = new AbortController();
      const blocks = new Map<number, { type: string; content: string }>();

      try {
        await fetchEventSource(
          `${SUPABASE_URL}/functions/v1/ai-chat-8c107efce1b0`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ messages: apiMessages }),
            signal: abortRef.current.signal,
            openWhenHidden: true,

            // Level 0: Parse errors from non-2xx SSE responses
            async onopen(response) {
              const ct = response.headers.get("content-type") ?? "";
              if (!response.ok) {
                if (ct.includes("text/event-stream")) {
                  const text = await response.text();
                  const dataMatch = text.match(/data: (.+)/);
                  if (dataMatch) {
                    try {
                      const errData = JSON.parse(dataMatch[1]);
                      if (errData.type === "error" && errData.error?.message) {
                        throw new Error(errData.error.message);
                      }
                    } catch (pe) {
                      if (
                        pe instanceof Error &&
                        pe.message !== "Unexpected token"
                      ) {
                        throw pe;
                      }
                    }
                  }
                }
                if (ct.includes("application/json")) {
                  const errData = await response.json();
                  throw new Error(
                    errData.error?.message || `请求失败: ${response.status}`
                  );
                }
                throw new Error(`请求失败: ${response.status}`);
              }
              if (!ct.includes("text/event-stream")) {
                throw new Error(`意外的响应类型: ${ct}`);
              }
            },

            // Level 1: Handle SSE error events mid-stream
            onmessage(event) {
              if (!event.data) return;
              let data: Record<string, unknown>;
              try {
                data = JSON.parse(event.data);
              } catch {
                return;
              }

              if (data.type === "error") {
                const err = data.error as { type?: string; message?: string };
                const msg = getErrorMessage(err?.type ?? "api_error", err?.message ?? "");
                setError(msg);
                setMessages((prev) =>
                  prev[prev.length - 1]?.role === "assistant" &&
                  prev[prev.length - 1]?.isStreaming
                    ? prev.slice(0, -1)
                    : prev
                );
                setIsLoading(false);
                return;
              }

              switch (data.type) {
                case "content_block_start": {
                  const cb = data.content_block as { type: string };
                  blocks.set(data.index as number, { type: cb.type, content: "" });
                  break;
                }
                case "content_block_delta": {
                  const block = blocks.get(data.index as number);
                  if (!block) break;
                  const delta = data.delta as { type: string; text?: string; thinking?: string };
                  if (block.type === "text" && delta.text) {
                    const textDelta = delta.text;
                    block.content += textDelta;
                    setMessages((prev) => {
                      const last = prev[prev.length - 1];
                      if (last?.role === "assistant") {
                        return [
                          ...prev.slice(0, -1),
                          { ...last, content: last.content + textDelta },
                        ];
                      }
                      return prev;
                    });
                  }
                  break;
                }
                case "message_stop":
                  setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (last?.role === "assistant") {
                      return [
                        ...prev.slice(0, -1),
                        { ...last, isStreaming: false },
                      ];
                    }
                    return prev;
                  });
                  setIsLoading(false);
                  break;
              }
            },

            // Level 2: Network errors
            onerror(err) {
              throw err;
            },
          }
        );
      } catch (err: unknown) {
        // Level 3: Catch all — filter AbortError
        const e = err as Error;
        if (e.name !== "AbortError") {
          setError(e.message || "连接失败，请稍后重试。");
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.isStreaming) {
              return prev.slice(0, -1);
            }
            return prev;
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && last.isStreaming) {
        return [...prev.slice(0, -1), { ...last, isStreaming: false }];
      }
      return prev;
    });
  }, []);

  const clearMessages = useCallback(() => {
    if (isLoading) abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setIsLoading(false);
  }, [isLoading]);

  const dismissError = useCallback(() => setError(null), []);

  return { messages, isLoading, error, sendMessage, stopStreaming, clearMessages, dismissError };
}
