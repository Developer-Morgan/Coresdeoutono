// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig as defineLovableConfig } from "@lovable.dev/vite-tanstack-config";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import path from "node:path";

// When BUILD_TARGET=vercel (or VERCEL=1) we build the project as a pure
// client-side SPA. We bypass @lovable.dev/vite-tanstack-config (which forces
// the Cloudflare adapter) and the TanStack Start plugin (which assumes an
// SSR runtime). Server functions are stubbed via aliases so the bundle
// still compiles.
const isVercelBuild =
  process.env.BUILD_TARGET === "vercel" || process.env.VERCEL === "1";

const r = (p: string) => path.resolve(__dirname, p);

export default isVercelBuild
  ? defineConfig({
      plugins: [tsConfigPaths(), tailwindcss(), viteReact()],
      resolve: {
        alias: [
          // Order matters: more specific aliases must come BEFORE generic "@".
          // No SSR/server runtime in the SPA build — replace server-only
          // modules with shims that compile but don't ship secrets.
          {
            find: /^@\/server\/admins\.functions$/,
            replacement: r("src/spa/admins.functions.stub.ts"),
          },
          {
            find: /^@tanstack\/react-start(\/.*)?$/,
            replacement: r("src/spa/react-start-shim.ts"),
          },
          { find: "@", replacement: r("src") },
        ],
      },
      build: {
        outDir: "dist",
        emptyOutDir: true,
      },
    })
  : defineLovableConfig();
