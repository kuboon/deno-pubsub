import { generate } from "../lib/crypto.ts";

export default async function Home() {
  const pair = await generate();
  return (
    <main class="prose">
      <h1>Pub Sub</h1>
      <h2>POST /api/topics</h2>
      <p>Returns `topicId` and `secret`. secret is for topic owner.</p>
      <h2>Publisher</h2>
      <code>
        {`
        const ws = new WebSocket("/api/topics/:topicId?secret=xxxx");
        ws.send({ anything: "to publish" });
      `}
      </code>
      <h2>Subscriber</h2>
      <code>
        {`
        const ws = new WebSocket("/api/topics/:topicId");
        ws.onmessage = (event) => {
          console.log(event.data);
        };
        // Subscriber can publish under 'pub'
        // use this for interaction.
        ws.send({ pub: "😀" });
      `}
      </code>
      <h1>Sample apps</h1>
      <p>
        <a href={`simplechat/${pair.topicId}?secret=${pair.secret}`}>
          Simple Chat
        </a>
      </p>
    </main>
  );
}
