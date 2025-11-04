import { Head } from "fresh/runtime";
import { HttpError, type PageProps } from "fresh";

export default function ErrorPage({ error }: PageProps) {
  const status = error instanceof HttpError ? error.status : 500;

  if (status === 404) {
    return (
      <>
        <Head>
          <title>404 - Page not found</title>
        </Head>
        <div class="px-4 py-8 mx-auto bg-[#86efac]">
          <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
            <img
              class="my-6"
              src="/logo.svg"
              width="128"
              height="128"
              alt="the Fresh logo: a sliced lemon dripping with juice"
            />
            <h1 class="text-4xl font-bold">404 - Page not found</h1>
            <p class="my-4">
              The page you were looking for doesn't exist.
            </p>
            <a href="/" class="underline">Go back home</a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Something went wrong</title>
      </Head>
      <div class="px-4 py-8 mx-auto bg-[#fca5a5]">
        <div class="max-w-screen-md mx-auto text-center space-y-4">
          <h1 class="text-4xl font-bold">Oh no...</h1>
          <p>Something went wrong while processing your request.</p>
        </div>
      </div>
    </>
  );
}
