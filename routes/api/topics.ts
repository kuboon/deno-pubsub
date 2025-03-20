import { Handlers } from "$fresh/server.ts";

// on POST return `generate` from `crypto.ts`
import { generate } from "../../lib/crypto.ts";

export const handler: Handlers = {
  POST: async () => {
    const pair = await generate();
    const subPath = "/api/topics/" + pair.topicId;
    const pubPath = "/api/topics/" + pair.topicId + "?secret=" + pair.secret;
    return Response.json({ subPath, pubPath, ...pair });
  },
};
