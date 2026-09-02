import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  // The graph-evaluation worker imports via the `~/` alias, so the worker
  // sub-build needs the tsconfig-paths resolver too.
  worker: {
    format: "es",
    plugins: () => [tsconfigPaths()],
  },
});
