import { IS_BROWSER } from "$fresh/runtime.ts";
import Presen from "../components/Presen/mod.tsx";

export default function PresenIsland() {
  const loading = <span class="loading loading-ring loading-xl">Loading</span>;
  return (
    <div id="entrypoint">
      {IS_BROWSER ? <Presen /> : loading}
    </div>
  );
}
