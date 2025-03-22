import { useEffect, useState } from "preact/hooks";
import { Pair } from "../lib/crypto.ts";
import { IS_BROWSER } from "$fresh/runtime.ts";

type Line = { name: string; message: string; timestamp: number; mine: boolean };
export default function SimpleChat({ topicId, secret }: Pair) {
  const [ws, setWs] = useState<WebSocket | undefined>();
  const [name, setName] = useState("");
  const [messages, setMessages] = useState<Line[]>([]);
  const [pubMessage, setPubMessage] = useState("");

  useEffect(() => {
    if (!IS_BROWSER) return;
    if (ws && ws.readyState === WebSocket.OPEN) return;
    const ws_ = new WebSocket(`/api/topics/${topicId}?secret=${secret}`);
    setWs(ws_);
    ws_.addEventListener("message", (event) => {
      const { name, message, timestamp } = JSON.parse(event.data).pub as Line;
      setMessages((
        prev,
      ) => [...prev, { name, message, timestamp, mine: false }]);
    });
    ws_.onerror = (event) => {
      console.error("WebSocket error observed:", event);
    };
    return () => {
      ws_.close();
    };
  }, []);

  if (name === "") {
    return (
      <form>
        <input
          type="text"
          name="name"
          value={name}
          placeholder="Enter your name"
        />
        <button
          type="submit"
          class="btn btn-primary"
          onClick={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget.form!);
            setName(formData.get("name") as string);
          }}
        >
          Join
        </button>
      </form>
    );
  }

  return (
    <>
      <div class="messages">
        {messages.map((msg, i) => (
          <div key={i} class={`chat ${msg.mine ? "chat-end" : "chat-start"}`}>
            <div class="chat-header">
              {msg.name}
              <time
                class="text-xs opacity-50 ml-2"
                datetime={new Date(msg.timestamp).toISOString()}
              >
                {new Date(msg.timestamp).toLocaleString()}
              </time>
            </div>
            <div
              class={`whitespace-pre-wrap chat-bubble ${
                msg.mine ? "chat-bubble-primary" : ""
              }`}
            >
              {msg.message}
            </div>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const timestamp = Date.now();
          const line = { name, message: pubMessage, timestamp, mine: true };
          if (ws) {
            ws.send(JSON.stringify({ pub: line }));
          }
          setMessages((prev) => [...prev, line]);
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
    </>
  );
}
