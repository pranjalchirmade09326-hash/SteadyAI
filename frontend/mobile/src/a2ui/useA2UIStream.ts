import { useState, useEffect, useRef, useCallback } from 'react';
import type { A2UISpec, A2UIBaseComponent } from './types';

interface UseA2UIStreamOptions {
  /** Backend SSE endpoint */
  endpoint: string;
  /** Headers e.g. Authorization */
  headers?: Record<string, string>;
  /** Called when stream errors out */
  onError?: (err: Error) => void;
  /** Called when stream completes */
  onComplete?: () => void;
}

interface UseA2UIStreamResult {
  spec: A2UISpec | null;
  isStreaming: boolean;
  error: string | null;
  sendMessage: (message: string, contextData?: Record<string, unknown>) => Promise<void>;
  reset: () => void;
}

/**
 * Hook to stream A2UI spec from backend.
 *
 * Backend must respond with JSONL lines, each line being a valid
 * A2UIBaseComponent JSON, and a final `[DONE]` sentinel.
 *
 * Example line:
 *   data: {"id":"c1","type":"MetricCard","props":{"label":"Steps","value":"8240"}}
 */
export function useA2UIStream({
  endpoint,
  headers = {},
  onError,
  onComplete,
}: UseA2UIStreamOptions): UseA2UIStreamResult {
  const [spec, setSpec] = useState<A2UISpec | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setSpec(null);
    setError(null);
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (message: string, contextData?: Record<string, unknown>) => {
      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsStreaming(true);
      setError(null);
      setSpec(null);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            ...headers,
          },
          body: JSON.stringify({ message, context: contextData }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        // --- Parse SSE stream ---
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body to stream');

        const decoder = new TextDecoder();
        const accumulatedComponents: A2UIBaseComponent[] = [];
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // Keep incomplete last line in buffer
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === ':') continue; // SSE comment or empty

            // Strip SSE "data: " prefix
            const dataStr = trimmed.startsWith('data:')
              ? trimmed.slice(5).trim()
              : trimmed;

            if (dataStr === '[DONE]') {
              onComplete?.();
              break;
            }

            try {
              // Could be a full spec or a single component
              const parsed = JSON.parse(dataStr);

              if (parsed.components && Array.isArray(parsed.components)) {
                // Full spec sent at once (non-streaming fallback)
                setSpec({ specId: parsed.specId, components: parsed.components });
              } else if (parsed.id && parsed.type) {
                // Single component chunk — accumulate for progressive render
                accumulatedComponents.push(parsed as A2UIBaseComponent);
                setSpec({
                  components: [...accumulatedComponents],
                });
              }
            } catch {
              // Non-JSON line — skip silently (could be SSE comment)
            }
          }
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return; // Intentional cancel

        const message = err instanceof Error ? err.message : 'Stream failed';
        setError(message);
        onError?.(err instanceof Error ? err : new Error(message));
      } finally {
        setIsStreaming(false);
      }
    },
    [endpoint, headers, onError, onComplete],
  );

  return { spec, isStreaming, error, sendMessage, reset };
}

/**
 * Simpler non-streaming version — for backends that return
 * a complete A2UI spec in one JSON response body.
 */
export async function fetchA2UISpec(
  endpoint: string,
  message: string,
  headers?: Record<string, string>,
): Promise<A2UISpec | null> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    // Accept either { components: [...] } or { spec: { components: [...] } }
    return json.components ? json : json.spec ?? null;
  } catch {
    return null;
  }
}
