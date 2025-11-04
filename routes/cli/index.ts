import { define } from "../../utils.ts";

const sourceUrl = new URL("../../cli/mod.ts", import.meta.url);

export const handler = define.handlers({
  async GET() {
    const source = await Deno.readTextFile(sourceUrl);
    return new Response(source, {
      headers: {
        "content-type": "application/typescript; charset=utf-8",
        "cache-control": "public, max-age=60",
      },
    });
  },
});
