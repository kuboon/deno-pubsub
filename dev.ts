import { Builder } from "fresh/dev";
import { tailwind } from "@fresh/plugin-tailwind";

const builder = new Builder({
  sourceMap: { kind: "both", sourcesContent: true },
});
tailwind(builder);

if (Deno.args.includes("build")) {
  // This creates a production build
  await builder.build();
} else {
  // This starts a development server with live reload
  await builder.listen(() => import("./main.ts"));
}
