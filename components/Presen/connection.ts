import {
  currentPageSignal,
  markdownSignal,
  Reaction,
  reactionsSignal,
} from "./signals.ts";

let ws: WebSocket | undefined;
let endpoint: string | undefined;
export function setEndpoint(newEndpoint: string) {
  endpoint = newEndpoint;
  initializeWebSocket();
}

function initializeWebSocket() {
  if (!endpoint) throw new Error("Endpoint is not set");
  if (ws) {
    if (
      ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING
    ) {
      return;
    }
    ws.close();
    ws = undefined;
  }

  ws = new WebSocket(endpoint);

  ws.onopen = () => {
    console.log("WebSocket connection established");
  };

  ws.onerror = (event) => {
    console.error("WebSocket error observed:", event);
  };

  ws.onclose = () => {
    console.log("WebSocket connection closed");
    ws = undefined;
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.currentPage !== undefined) {
        currentPageSignal.value = data.currentPage;
      }
      if (data.pub && data.pub.reaction) {
        const reaction: Reaction = data.pub.reaction;
        reactionsSignal.value = [
          ...reactionsSignal.value,
          reaction,
        ];
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };
}

function isWebSocketOpen(ws: WebSocket | undefined): ws is WebSocket {
  if (!ws) {
    console.log("Attempting to reconnect WebSocket...");
    initializeWebSocket();
  } else if (ws.readyState === WebSocket.CLOSED) {
    console.log("Attempting to reconnect WebSocket...");
    initializeWebSocket();
  }
  if (!ws) return false;

  return ws.readyState === WebSocket.OPEN;
}

export function publishCurrentPage() {
  if (isWebSocketOpen(ws)) {
    ws.send(
      JSON.stringify({ currentPage: currentPageSignal.peek() }),
    );
  }
}

export async function publishMarkdown() {
  if (!endpoint) throw new Error("Endpoint is not set");
  await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify({ markdown: markdownSignal.peek() }),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function publishReaction(reaction: Reaction) {
  if (isWebSocketOpen(ws)) {
    ws.send(
      JSON.stringify({ pub: { reaction } }),
    );
  }
}
