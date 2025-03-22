# deno pub-sub

A lightweight pub-sub implementation using WebSockets in Deno. This project allows publishers to send messages to a topic and subscribers to receive those messages in real-time. Subscribers can also publish under a special `pub` key for interaction.

### Features
- Create topics dynamically via an API.
- Publish and subscribe to topics using WebSockets.
- Simple interaction between publishers and subscribers.

---

### Develop on your local machine

Make sure to install Deno: https://deno.land/manual/getting_started/installation

Then start the project:

```
deno task start
```

This will watch the project directory and restart as necessary.

---

### Usage

#### Create a Topic
Send a `POST` request to `/api/topics` to create a new topic. The response will include:
- `topicId`: The unique identifier for the topic.
- `secret`: A secret key for the topic owner.

#### Publisher
To publish messages to a topic, connect to the WebSocket endpoint with the `topicId` and `secret`:
```javascript
const ws = new WebSocket("/api/topics/:topicId?secret=xxxx");
ws.send(JSON.stringify({ anything: "to publish" }));
```

#### Subscriber
To subscribe to a topic, connect to the WebSocket endpoint with the `topicId`:
```javascript
const ws = new WebSocket("/api/topics/:topicId");
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

### Example
Visit the `Simple Chat` page to see an example of a pub-sub interaction:
```
<a href="simplechat/:topicId?secret=xxxx">Simple Chat</a>
```
Replace `:topicId` and `xxxx` with the values returned from the `POST /api/topics` request.
