import { useEffect, useState } from "preact/hooks";
import { Pair } from "../lib/crypto.ts";
import { IS_BROWSER } from "fresh/runtime";

type Line = { name: string; message: string; timestamp: number; mine: boolean };
const addLine = (line: Line) => (lines: Line[]) => [...lines, line];

export default function SimpleChat({ topicId, secret }: Pair) {
  const [ws, setWs] = useState<WebSocket | undefined>();
  const [name, setName] = useState("");
  const [messages, setMessages] = useState<Line[]>([]);

  useEffect(() => {
    if (!IS_BROWSER) return;
    const joinUrl = document.getElementById("join-url") as HTMLInputElement | null;
    if (joinUrl) {
      joinUrl.onfocus = () => joinUrl.select();
    }
    if (ws && ws.readyState === WebSocket.OPEN) return;
    const ws_ = new WebSocket(`/api/topics/${topicId}?secret=${secret}`);
    setWs(ws_);
    ws_.addEventListener("message", (event) => {
      const { name, message, timestamp } = JSON.parse(event.data).pub as Line;
      setMessages(addLine({ name, message, timestamp, mine: false }));
    });
    ws_.onerror = (event) => {
      console.error("WebSocket error observed:", event);
    };
    return () => {
      ws_.close();
    };
  }, []);

  if (name === "") {
    return <NameForm onSubmit={setName} />;
  }

  return (
    <>
      <div class="messages">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.timestamp}
            message={msg}
          />
        ))}
      </div>
      <MessageForm
        onSubmit={(message) => {
          const timestamp = Date.now();
          const line = { name, message, timestamp, mine: true };
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ pub: line }));
          }
          setMessages(addLine(line));
        }}
      />
    </>
  );
}

function ChatMessage({ message }: { message: Line }) {
  return (
    <div class={`chat ${message.mine ? "chat-end" : "chat-start"}`}>
      <div class="chat-header">
        {message.name}
        <time
          class="text-xs opacity-50 ml-2"
          datetime={new Date(message.timestamp).toISOString()}
        >
          {new Date(message.timestamp).toLocaleString()}
        </time>
      </div>
      <div
        class={`whitespace-pre-wrap chat-bubble ${
          message.mine ? "chat-bubble-primary" : ""
        }`}
      >
        {message.message}
      </div>
    </div>
  );
}

function NameForm({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [inputName, setInputName] = useState("");

  return (
    <form
      class="join"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(inputName);
      }}
    >
      <input
        class="input input-bordered join-item"
        type="text"
        name="name"
        value={inputName}
        placeholder="Enter your name"
        onInput={(e) => setInputName(e.currentTarget.value)}
      />
      <button
        type="submit"
        class="btn btn-primary join-item"
      >
        Join
      </button>
    </form>
  );
}

function MessageForm({ onSubmit }: {
  onSubmit: (message: string) => void;
}) {
  const [pubMessage, setPubMessage] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(pubMessage);
        setPubMessage("");
        e.currentTarget.reset();
      }}
    >
      <textarea
        class="textarea"
        name="pubMessage"
        onInput={(e) => setPubMessage(e.currentTarget.value)}
        placeholder="Type a message"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
      >
        {pubMessage}
      </textarea>
      <button
        type="submit"
        class="btn btn-primary"
      >
        Send
      </button>
    </form>
  );
}
