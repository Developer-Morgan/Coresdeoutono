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

// When building for Vercel (BUILD_TARGET=vercel, set by `vercel-build` script
// or automatically when VERCEL=1 is present), bypass the Lovable preset
// (which forces the Cloudflare adapter) and run TanStack Start standalone.
// Nitro auto-detects the Vercel preset via the VERCEL=1 env var that Vercel
// sets in its build environment, producing .vercel/output for deploy.
const isVercelBuild =
  process.env.BUILD_TARGET === "vercel" || process.env.VERCEL === "1";

export default isVercelBuild
  ? defineConfig({
      plugins: [
        tsConfigPaths(),
        tailwindcss(),
        tanstackStart(),
        viteReact(),
      ],
    })
  : defineLovableConfig();
