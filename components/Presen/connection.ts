import { currentPageSignal, markdownSignal, titleSignal } from "./signals.ts";

let ws: WebSocket | undefined;
let endpoint: string | undefined;
export function setEndpoint(newEndpoint: string) {
  endpoint = newEndpoint;
  initializeWebSocket();
}

function initializeWebSocket() {
  if(!endpoint) throw new Error("Endpoint is not set");
  if (ws) {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
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
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };
}

function isWebSocketOpen(ws: WebSocket | undefined): ws is WebSocket {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    if (!ws || ws.readyState === WebSocket.CLOSED) {
      console.log("Attempting to reconnect WebSocket...");
      initializeWebSocket(ws?.url || "");
    }
    return false;
  }
  return true;
}

export function publishCurrentPage() {
  if (isWebSocketOpen(ws)) {
    ws.send(
      JSON.stringify({ currentPage: currentPageSignal.peek() }),
    );
  }
}

export function publishMarkdown() {
  if (isWebSocketOpen(ws)) {
    ws.send(
      JSON.stringify({ markdown: markdownSignal.peek() }),
    );
  }
}

export function publishTitle() {
  if (isWebSocketOpen(ws)) {
    ws.send(
      JSON.stringify({ title: titleSignal.peek() }),
    );
  }
}

export function publishReaction(reaction: string) {
  if (isWebSocketOpen(ws)) {
    ws.send(
      JSON.stringify({ reaction }),
    );
  }
}