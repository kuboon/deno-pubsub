import { type PageProps } from "$fresh/server.ts";
export default function App({ Component }: PageProps) {
  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>pubsub.kbn.one</title>
        <link rel="stylesheet" href="/styles.css" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body class="container m-8">
        <Component />
      </body>
    </html>
  );
}
