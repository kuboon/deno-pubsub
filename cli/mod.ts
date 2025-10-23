#!/usr/bin/env -S deno run -A
import { encode as encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

type Pair = { topicId: string; secret: string };

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

type BrowserCommand = {
  cmd: string;
  args: string[];
};

function resolveBrowserCommand(url: string): BrowserCommand | null {
  switch (Deno.build.os) {
    case "darwin":
      return { cmd: "open", args: [url] };
    case "linux":
      return { cmd: "xdg-open", args: [url] };
    case "windows":
      return { cmd: "cmd", args: ["/c", "start", "", url] };
    default:
      return null;
  }
}

async function openBrowser(url: string): Promise<boolean> {
  const command = resolveBrowserCommand(url);
  if (!command) {
    console.warn(
      `[pubsub] unable to automatically open a browser on ${Deno.build.os}`,
    );
    return false;
  }

  console.log(`[pubsub] opening browser: ${url}`);
  try {
    const opener = new Deno.Command(command.cmd, {
      args: command.args,
      stdin: "null",
      stdout: "null",
      stderr: "inherit",
    }).spawn();
    const status = await opener.status;
    if (!status.success) {
      console.warn(`[pubsub] failed to open browser (exit ${status.code})`);
    }
    return status.success;
  } catch (error) {
    console.warn("[pubsub] failed to open browser", error);
    return false;
  }
}

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
) {
  const payload = message.pub;
  if (!payload) return;
  if (payload.type === "stdin" && payload.data) {
    await writer?.write(textEncoder.encode(payload.data));
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

  await openBrowser(urls.owner);

  const command = new Deno.Command(Deno.args[0], {
    args: Deno.args.slice(1),
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });

  const child = command.spawn();
  const writer = child.stdin?.getWriter();

  const signalHandler = (signal: Deno.Signal) => {
    console.error(
      `[pubsub] received ${signal}, forwarding to child process...`,
    );
    try {
      child.kill(signal);
    } catch (error) {
      console.error("[pubsub] failed to send signal", error);
    }
  };
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    Deno.addSignalListener(signal, signalHandler);
  }

  ws.addEventListener("message", (event) => {
    try {
      const message = JSON.parse(event.data) as PubMessage;
      handlePubMessage(message, writer).catch((error) => {
        console.error("[pubsub] failed to write to child stdin", error);
      });
    } catch (error) {
      console.error("[pubsub] invalid message", error);
    }
  });

  ws.addEventListener("close", () => {
    console.error("[pubsub] websocket closed");
  });

  sendMessage(ws, { type: "ready" });

  const [stdoutResult, stderrResult, status] = await Promise.all([
    forwardStream(ws, child.stdout, "stdout"),
    forwardStream(ws, child.stderr, "stderr"),
    child.status,
  ]);
  void stdoutResult;
  void stderrResult;

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    Deno.removeSignalListener(signal, signalHandler);
  }

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
