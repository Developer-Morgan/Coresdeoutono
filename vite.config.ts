// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig as defineLovableConfig } from "@lovable.dev/vite-tanstack-config";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// When building for Vercel (BUILD_TARGET=vercel), bypass the Lovable preset
// (which forces the Cloudflare target) and configure TanStack Start with
// target: "vercel" so the build emits .vercel/output for Vercel to serve.
const isVercelBuild = process.env.BUILD_TARGET === "vercel";

export default isVercelBuild
  ? defineConfig({
      plugins: [
        tsConfigPaths(),
        tailwindcss(),
        tanstackStart({ target: "vercel" }),
        viteReact(),
      ],
    })
  : defineLovableConfig();
