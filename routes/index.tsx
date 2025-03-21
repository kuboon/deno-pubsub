import { generate } from "../lib/crypto.ts";

export default async function Home() {
  const pair = await generate();
  return (
    <main class="prose">
      <h1>Pub Sub</h1>
      <h2>POST /api/topics</h2>
      <p>Returns `topicId` and `secret`. secret is for topic owner.</p>
      <h2>Publisher</h2>
      <pre><code>{`const ws = new WebSocket("/api/topics/:topicId?secret=xxxx");
ws.send(JSON.stringify({ anything: "to publish" }));`}</code></pre>
      <h2>Subscriber</h2>
      <pre><code>{`const ws = new WebSocket("/api/topics/:topicId");
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data is the published data.
  console.log(data.anything);
}
// Subscriber can publish under 'pub'
// use this for interaction.
ws.send(JSON.stringify({ pub: "😀" }));`}</code></pre>
      <h1>Sample apps</h1>
      <p>
        <a href={`simplechat/${pair.topicId}?secret=${pair.secret}`}>
          Simple Chat
        </a>
      </p>
    </main>
  );
}
