import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export const BASE = "/nightreign-cheatsheet/";

export const REPO = "https://github.com/AyoJusto/nightreign-cheatsheet";

/**
 * The commit this bundle was built from, stamped in at build time so the page can
 * say which revision you are looking at.
 *
 * GITHUB_SHA first because it is the one thing a Pages build is guaranteed to
 * have; the git call covers local builds. Falling back to a literal rather than
 * failing the build — a missing stamp should cost you a footer line, not a deploy.
 */
function revision(): string {
  const sha =
    process.env.GITHUB_SHA ??
    (() => {
      try {
        return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString();
      } catch {
        return "";
      }
    })();
  return sha.trim().slice(0, 7) || "local";
}

// Pages serves this from a repo subpath, so the build needs it baked in.
// `vite preview` reports command === "serve" just like dev does, so keying off
// command alone made preview serve at "/" while the built HTML asked for
// "/nightreign-cheatsheet/assets/..." — every asset 404s and nothing mounts.
// isPreview is what separates the two.
export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? BASE : "/",
  plugins: [react(), tailwindcss()],
  define: {
    __REVISION__: JSON.stringify(revision()),
    __REPO__: JSON.stringify(REPO),
  },
  test: { environment: "node" },
}));
