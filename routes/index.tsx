import { generate } from "../lib/crypto.ts";
const origin = "https://pubsub.kbn.one";

export default async function Home() {
  const pair = await generate();
  return (
    <main class="prose m-8">
      <h1>Pub Sub</h1>
      <p>
        <a href={`presen/${pair.topicId}?secret=${pair.secret}`}>
          Presentation
        </a>
      </p>
      <p>
        <a href={`simplechat/${pair.topicId}?secret=${pair.secret}`}>
          Simple Chat
        </a>
      </p>
      <p>
        <a href="terminal">
          Terminal
        </a>
      </p>

      <h1>API</h1>
      <h2>POST /api/topics</h2>
      <p>Returns `topicId` and `secret`. secret is for topic owner.</p>
      <h2>Publisher</h2>
      <pre><code>{`const apiBase = "${origin}/api/topics";
const pair = await fetch(apiBase, { method: "POST" }).then(x => x.json());
const subscriberUrl = \`\${apiBase}/\${pair.topicId}\`;
console.log("subscriberUrl", subscriberUrl);
const ws = new WebSocket(\`\${subscriberUrl}?secret=\${pair.secret}\`);
ws.send(JSON.stringify({ anything: "to publish" }));`}</code></pre>
      <h2>Subscriber</h2>
      <pre><code>{`const ws = new WebSocket(subscriberUrl);
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data is the published data.
  console.log(data.anything);
}
// Subscriber can publish under 'pub'
// use this for interaction.
ws.send(JSON.stringify({ pub: "😀" }));`}</code></pre>
    </main>
  );
}
