import { useEffect, useState } from "preact/hooks";
import { Pair } from "../lib/crypto.ts";
import { IS_BROWSER } from "$fresh/runtime.ts";

type Line = { name: string; message: string };
export default function SimpleChat({ topicId, secret }: Pair) {
  const [ws, setWs] = useState<WebSocket | undefined>();
  const [name, setName] = useState("");
  // const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState<Line[]>([]);
  const [pubMessage, setPubMessage] = useState("");

  useEffect(() => {
    if (!IS_BROWSER) return;
    if (ws && ws.readyState === WebSocket.OPEN) return;
    const ws_ = new WebSocket(`/api/topics/${topicId}?secret=${secret}`);
    setWs(ws_);
    ws_.addEventListener("message", (event) => {
      const { name, message } = JSON.parse(event.data).pub as Line;
      setMessages((prev) => [...prev, { name, message }]);
    });
    ws_.onerror = (event) => {
      console.error("WebSocket error observed:", event);
      // setWs(new WebSocket(ws_.url));
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
          disabled={!IS_BROWSER}
        />
        <button
          type="submit"
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
          <div key={i}>
            <strong>{msg.name}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <form>
        <input
          type="text"
          value={pubMessage}
          onInput={(e) => setPubMessage(e.currentTarget.value)}
          placeholder="Type a message"
        />
        <button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            const line = { name, message: pubMessage };
            if (ws) {
              ws.send(JSON.stringify({ pub: line }));
            }
            setMessages((prev) => [...prev, line]);
            setPubMessage("");
          }}
        >
          Send
        </button>
      </form>
    </>
  );
}
