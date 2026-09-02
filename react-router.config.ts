import type { Config } from "@react-router/dev/config";

export default {
  // Pure client-side app — no route loaders/actions, the UI is all
  // canvas / Web Worker / local state. SPA mode ships a static bundle
  // (no serverless SSR function), which is what Vercel serves.
  ssr: false,
} satisfies Config;
