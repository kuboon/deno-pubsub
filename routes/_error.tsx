import { HttpError, PageProps } from "fresh";

export default function ErrorPage(props: PageProps) {
  const error = props.error;

  if (error instanceof HttpError && error.status === 404) {
    return (
      <>
        <div class="px-4 py-8 mx-auto bg-[#86efac]">
          <div class="max-w-3xl mx-auto flex flex-col items-center justify-center">
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

  return <div>500 Internal Error</div>;
}
