#!/usr/bin/env -S deno run -A
import { encodeBase64 } from "@std/encoding";
import { Pair } from "../lib/crypto.ts";

type PubMessage = {
  pub?: { type?: string; data?: string; cols?: number; rows?: number };
  uuid?: string;
};

type ExitMessage = {
  type: "exit";
  code: number;
  success: boolean;
  signal?: string | null;
};

type StreamMessage = {
  type: "stdout" | "stderr";
  data: string;
};

type ReadyMessage = { type: "ready" };

type OutgoingMessage = ReadyMessage | StreamMessage | ExitMessage;

const DEFAULT_BASE = "https://pubsub.kbn.one";
const textEncoder = new TextEncoder();

async function createTopic(baseUrl: string): Promise<Pair> {
  const response = await fetch(new URL("/api/topics", baseUrl), {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(
      `Failed to create topic: ${response.status} ${response.statusText}`,
    );
  }
  const json = await response.json();
  return { topicId: json.topicId, secret: json.secret };
}

function toWebSocketUrl(baseUrl: string, pair: Pair): string {
  const url = new URL(`/api/topics/${pair.topicId}`, baseUrl);
  url.searchParams.set("secret", pair.secret);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.href;
}

function terminalUrl(baseUrl: string, topicId: string, secret: string) {
  const base = new URL(baseUrl);
  base.pathname = `/terminal/${topicId}`;
  base.search = "";
  const owner = new URL(base);
  owner.searchParams.set("secret", secret);
  return { share: base.href, owner: owner.href };
}

async function waitForOpen(ws: WebSocket): Promise<void> {
  if (ws.readyState === WebSocket.OPEN) return;
  await new Promise<void>((resolve, reject) => {
    const handleOpen = () => {
      cleanup();
      resolve();
    };
    const handleError = (event: Event | ErrorEvent) => {
      cleanup();
      reject(
        event instanceof ErrorEvent
          ? event.error
          : new Error("WebSocket error"),
      );
    };
    const cleanup = () => {
      ws.removeEventListener("open", handleOpen);
      ws.removeEventListener("error", handleError);
    };
    ws.addEventListener("open", handleOpen, { once: true });
    ws.addEventListener("error", handleError, { once: true });
  });
}

async function forwardStream(
  ws: WebSocket,
  stream: ReadableStream<Uint8Array> | null | undefined,
  type: StreamMessage["type"],
) {
  if (!stream) return;
  const reader = stream.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value || value.length === 0) continue;
      if (ws.readyState !== WebSocket.OPEN) break;
      const message: StreamMessage = { type, data: encodeBase64(value) };
      sendMessage(ws, message);
      Deno.stdout.write(value);
    }
  } finally {
    reader.releaseLock();
  }
}

function sendMessage(ws: WebSocket, message: OutgoingMessage) {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(message));
}

async function handlePubMessage(
  message: PubMessage,
  writer?: WritableStreamDefaultWriter<Uint8Array>,
  onOpened?: () => void,
) {
  const payload = message.pub;
  if (!payload) return;
  if (payload.type === "opened" && onOpened) {
    onOpened();
  } else if (payload.type === "stdin" && payload.data && writer) {
    try {
      await writer.write(textEncoder.encode(payload.data));
    } catch (error) {
      console.error("[pubsub] failed to write stdin", error);
    }
  } else if (payload.type === "resize" && payload.cols && payload.rows) {
    // リサイズ処理（将来的な拡張用）
    console.log(`[pubsub] terminal resize: ${payload.cols}x${payload.rows}`);
  }
}

function usage() {
  console.error(
    "Usage: deno run -A https://pubsub.kbn.one/cli <command> [...args]",
  );
  console.error("Set PUBSUB_BASE to override the API origin.");
}

async function main() {
  if (Deno.args.length === 0) {
    usage();
    Deno.exit(1);
  }

  const baseUrl = Deno.env.get("PUBSUB_BASE") ?? DEFAULT_BASE;
  const pair = await createTopic(baseUrl);
  const urls = terminalUrl(baseUrl, pair.topicId, pair.secret);

  console.log(`[pubsub] topic: ${pair.topicId}`);
  console.log(`[pubsub] share: ${urls.share}`);
  console.log(`[pubsub] owner: ${urls.owner}`);

  const wsUrl = toWebSocketUrl(baseUrl, pair);
  const ws = new WebSocket(wsUrl);
  await waitForOpen(ws);

  console.log("[pubsub] waiting for browser to open...");

  // 'opened'メッセージを待つPromise
  const { promise: openedPromise, resolve: resolveOpened } = Promise
    .withResolvers<void>();

  let child: Deno.ChildProcess | null = null;
  let writer: WritableStreamDefaultWriter<Uint8Array> | undefined;

  const startProcess = () => {
    console.log("[pubsub] browser opened, starting process...");

    // Try to use script command to create a pseudo-terminal
    // This is a workaround since Deno doesn't have native pty support
    const isVimLike = Deno.args[0] &&
      ["vim", "vi", "nano", "emacs"].includes(Deno.args[0]);

    let command: Deno.Command;
    const env = {
      ...Deno.env.toObject(),
      TERM: "xterm-256color",
      COLORTERM: "truecolor",
      FORCE_COLOR: "1",
      LINES: "24",
      COLUMNS: "80",
      TERMINAL: "deno-pubsub",
    };

    if (isVimLike) {
      // Use script command to create a pty for terminal applications
      command = new Deno.Command("script", {
        args: [
          "-qec",
          `${Deno.args[0]} ${Deno.args.slice(1).join(" ")}`,
          "/dev/null",
        ],
        stdin: "piped",
        stdout: "piped",
        stderr: "piped",
        env,
      });
    } else {
      // Regular command for non-terminal applications
      command = new Deno.Command(Deno.args[0], {
        args: Deno.args.slice(1),
        stdin: "piped",
        stdout: "piped",
        stderr: "piped",
        env,
      });
    }

    child = command.spawn();
    writer = child.stdin?.getWriter();

    // Monitor process status
    child.status.then((status) => {
      console.log(`[pubsub] process exited with code ${status.code}`);
      if (status.signal) {
        console.log(`[pubsub] process killed by signal ${status.signal}`);
      }
      // Send exit message to browser
      if (ws.readyState === WebSocket.OPEN) {
        const exitMessage: ExitMessage = {
          type: "exit",
          code: status.code || 0,
          success: status.success,
          signal: status.signal,
        };
        sendMessage(ws, exitMessage);
      }
    }).catch((error) => {
      console.error("[pubsub] failed to wait for process", error);
    });

    resolveOpened();
  };

  ws.addEventListener("message", async (event) => {
    try {
      const message = JSON.parse(event.data) as PubMessage;
      await handlePubMessage(message, writer, startProcess);
    } catch (error) {
      console.error("[pubsub] failed to handle message", error);
    }
  });

  ws.addEventListener("close", () => {
    console.error("[pubsub] websocket closed");
  });

  sendMessage(ws, { type: "ready" });

  // 'opened'メッセージを待ってから子プロセスの処理を開始
  await openedPromise;

  if (!child) {
    console.error("[pubsub] child process not started");
    Deno.exit(1);
  }

  const sigintHandler = () => {
    console.error(
      `[pubsub] received SIGINT, forwarding to child process...`,
    );
    try {
      child?.kill("SIGINT");
    } catch (error) {
      console.error("[pubsub] failed to send signal", error);
    }
  };
  const sigtermHandler = () => {
    console.error(
      `[pubsub] received SIGTERM, forwarding to child process...`,
    );
    try {
      child?.kill("SIGTERM");
    } catch (error) {
      console.error("[pubsub] failed to send signal", error);
    }
  };
  Deno.addSignalListener("SIGINT", sigintHandler);
  Deno.addSignalListener("SIGTERM", sigtermHandler);

  const [stdoutResult, stderrResult, status] = await Promise.all([
    forwardStream(ws, (child as Deno.ChildProcess).stdout, "stdout"),
    forwardStream(ws, (child as Deno.ChildProcess).stderr, "stderr"),
    (child as Deno.ChildProcess).status,
  ]);
  void stdoutResult;
  void stderrResult;

  Deno.removeSignalListener("SIGINT", sigintHandler);
  Deno.removeSignalListener("SIGTERM", sigtermHandler);

  try {
    await writer?.close();
  } catch {
    // ignore
  }

  sendMessage(ws, {
    type: "exit",
    code: status.code,
    success: status.success,
    signal: status.signal ?? null,
  });
  ws.close();

  Deno.exit(status.success ? 0 : status.code ?? 1);
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error("[pubsub] error", error);
    Deno.exit(1);
  }
}
