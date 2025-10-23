import { useEffect, useRef, useState } from "preact/hooks";

type TerminalMessage =
  | { type: "ready" }
  | { type: "stdout"; data: string }
  | { type: "stderr"; data: string }
  | { type: "exit"; code: number; success: boolean; signal?: string | null }
  | { type: string; [key: string]: unknown };

type Props = { topicId: string; secret: string };

const decoder = new TextDecoder();

function decodeBase64(data: string) {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export default function Terminal({ topicId, secret }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("接続中...");

  useEffect(() => {
    let dispose = false;
    let term: any;
    let fitAddon: any;
    let ws: WebSocket | null = null;

    const handleResize = () => {
      try {
        fitAddon?.fit();
      } catch {
        // ignore
      }
    };

    const cleanup = () => {
      window.removeEventListener("resize", handleResize);
      if (ws) {
        ws.close();
        ws = null;
      }
      if (term) {
        term.dispose();
        term = null;
      }
      if (fitAddon) {
        fitAddon.dispose?.();
        fitAddon = null;
      }
    };

    (async () => {
      const [{ Terminal: XTerm }, { FitAddon }] = await Promise.all([
        import("https://esm.sh/xterm@5.3.0?bundle"),
        import("https://esm.sh/xterm-addon-fit@0.7.0?bundle"),
      ]);
      if (dispose) return;
      term = new XTerm({
        convertEol: true,
        fontFamily:
          "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        fontSize: 14,
        cursorBlink: true,
      });
      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(containerRef.current!);
      fitAddon.fit();
      term.focus();
      term.writeln("Connecting websocket...");

      const wsUrl = new URL(`/api/topics/${topicId}`, window.location.origin);
      if (secret) {
        wsUrl.searchParams.set("secret", secret);
      }
      wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(wsUrl);

      ws.addEventListener("open", () => {
        setStatus("接続しました");
        term.writeln("Ready. Waiting for process...\r\n");
      });

      ws.addEventListener("close", () => {
        setStatus("切断されました");
        term.writeln("\r\n[connection closed]");
      });

      ws.addEventListener("error", () => {
        setStatus("接続エラー");
        term.writeln("\r\n[connection error]");
      });

      ws.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data) as TerminalMessage | {
            uuid: string;
            pub: unknown;
          };
          if ("pub" in message) {
            return;
          }
          switch (message.type) {
            case "ready":
              setStatus("プロセスと接続しました");
              term.writeln("Process connected.\r\n");
              break;
            case "stdout":
            case "stderr": {
              const bytes = decodeBase64(message.data);
              const text = decoder.decode(bytes);
              term.write(text);
              break;
            }
            case "exit":
              setStatus("プロセスが終了しました");
              term.writeln(`\r\nProcess exited (code: ${message.code}).`);
              break;
            default:
              break;
          }
        } catch (error) {
          console.error(error);
        }
      });

      term.onData((data: string) => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ pub: { type: "stdin", data } }));
        }
      });

      term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ pub: { type: "resize", cols, rows } }));
        }
      });

      window.addEventListener("resize", handleResize);
    })();

    return () => {
      dispose = true;
      cleanup();
    };
  }, [topicId, secret]);

  return (
    <div class="terminal-shell">
      <p class="status text-sm text-gray-500">{status}</p>
      <div ref={containerRef} class="terminal-container" />
    </div>
  );
}
