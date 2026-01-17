import Presen from "../../islands/Presen.tsx";
import { verify } from "../../lib/crypto.ts";
import { HttpError, PageProps } from "fresh";
import { Head } from "fresh/runtime";

export default async function PresenPage(props: PageProps) {
  const topicId = props.params["topicId"];
  const url = new URL(props.url);
  const secret = url.searchParams.get("secret") || "";
  const verified = await verify({ topicId, secret });

  if (verified === "invalid") {
    throw new HttpError(404);
  }
  using kv = await Deno.openKv();
  const entry = await kv.get<{ markdown: string }>([topicId]);
  if (verified === "readable" && entry.versionstamp === null) {
    throw new HttpError(404);
  }
  const data = entry.value;
  const markdown = data?.markdown || "";
  const title = markdown.match(/#\s*(.+)/)?.[1] ||
    new Date().toISOString().slice(0, 10);
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <Presen />
    </>
  );
}
