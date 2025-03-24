# deno pub-sub

A lightweight pub-sub implementation using WebSockets in Deno. This project
allows publishers to send messages to a topic and subscribers to receive those
messages in real-time. Subscribers can also publish under a special `pub` key
for interaction.

### Features

- Create topics dynamically via an API.
- Publish and subscribe to topics using WebSockets.
- Simple interaction between publishers and subscribers.

---

### Usage

#### Create a Topic

Send a `POST` request to `/api/topics` to create a new topic. The response will
include:

- `topicId`: The unique identifier for the topic.
- `secret`: A secret key for the topic owner.

Example:

```javascript
const apiBase = "https://pubsub.kbn.one/api/topics";
const pair = await fetch(apiBase, { method: "POST" }).then((x) => x.json());
console.log(pair); // { topicId: "abc123", secret: "xyz456" }
```

#### Publisher

To publish messages to a topic, connect to the WebSocket endpoint with the
`topicId` and `secret`:

```javascript
const apiBase = "https://pubsub.kbn.one/api/topics";
const pair = await fetch(apiBase, { method: "POST" }).then((x) => x.json());
const subscriberUrl = `${apiBase}/${pair.topicId}`;
console.log("subscriberUrl", subscriberUrl);

await fetch(subscriberUrl + `?secret=${pair.secret}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ initial: "state" }),
});
const ws = new WebSocket(`${subscriberUrl}?secret=${pair.secret}`);
ws.send(JSON.stringify({ anything: "to publish" }));
```

#### Subscriber

To subscribe to a topic, connect to the WebSocket endpoint with the `topicId`:

```javascript
const endpoint = `https://pubsub.kbn.one/api/topics/${topicId}`;
const initialState = await fetch(endpoint).then((x) => x.json());
const ws = new WebSocket(endpoint);
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data is the published data.
  console.log(data.anything);
};
```

Subscribers can also publish under the `pub` key for interaction:

```javascript
ws.send(JSON.stringify({ pub: "😀" }));
```

---

### New Endpoint: POST /topics/:id

This endpoint allows you to store the post body JSON to Deno.kv using the topic
ID as the key.

#### Example

```javascript
const topicId = "abc123";
const data = { message: "Hello, World!" };

fetch(`https://pubsub.kbn.one/topics/${topicId}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
})
  .then((response) => response.json())
  .then((result) => {
    console.log("Data stored in Deno.kv:", result);
  })
  .catch((error) => {
    console.error("Error storing data:", error);
  });
```

---

### New Endpoint: GET /topics/:id

This endpoint allows you to retrieve the stored JSON from Deno.kv using the
topic ID as the key.

#### Example

```javascript
const topicId = "abc123";

fetch(`https://pubsub.kbn.one/topics/${topicId}`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
})
  .then((response) => response.json())
  .then((result) => {
    console.log("Data retrieved from Deno.kv:", result);
  })
  .catch((error) => {
    console.error("Error retrieving data:", error);
  });
```

---

### Example

Visit the `Simple Chat` page to see an example of a pub-sub interaction:

```html
<a href="simplechat/">Simple Chat</a>
```

---

### Develop on your local machine

Make sure to install Deno: https://deno.land/manual/getting_started/installation

Then start the project:

```bash
deno task start
```

This will watch the project directory and restart as necessary.
