import {
  currentPageSignal,
  markdownSignal,
  Reaction,
  reactionsSignal,
} from "./signals.ts";

let ws: WebSocket | undefined;
let endpoint: string | undefined;
let publisher = false;
export function setEndpoint(newEndpoint: string) {
  endpoint = newEndpoint;
  publisher = endpoint.includes("secret");
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
      if (data.markdown !== undefined) {
        markdownSignal.value = data.markdown;
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

export async function publishMarkdown() {
  if (!endpoint) throw new Error("Endpoint is not set");
  if (!publisher) return;
  await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify({ markdown: markdownSignal.peek() }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (isWebSocketOpen(ws)) {
    ws.send(
      JSON.stringify({ markdown: markdownSignal.peek() }),
    );
  }
}
export async function getMarkdown() {
  if (!endpoint) throw new Error("Endpoint is not set");
  const response = await fetch(endpoint);
  if (!response.ok) return null;
  const data = await response.json();
  return data.markdown;
}

export function publishCurrentPage() {
  if (publisher && isWebSocketOpen(ws)) {
    ws.send(
      JSON.stringify({ currentPage: currentPageSignal.peek() }),
    );
  }
}

export function publishReaction(reaction: Reaction) {
  if (isWebSocketOpen(ws)) {
    ws.send(
      JSON.stringify({ pub: { reaction } }),
    );
  }
}
