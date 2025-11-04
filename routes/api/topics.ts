import { generate } from "../../lib/crypto.ts";
import { define } from "../../utils.ts";

export const handler = define.handlers({
  async POST() {
    const pair = await generate();
    const subPath = "/api/topics/" + pair.topicId;
    const pubPath = "/api/topics/" + pair.topicId + "?secret=" + pair.secret;
    return Response.json({ subPath, pubPath, ...pair });
  },
});
