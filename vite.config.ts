import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export const BASE = "/nightreign-cheatsheet/";

// Pages serves this from a repo subpath, so the build needs it baked in.
// `vite preview` reports command === "serve" just like dev does, so keying off
// command alone made preview serve at "/" while the built HTML asked for
// "/nightreign-cheatsheet/assets/..." — every asset 404s and nothing mounts.
// isPreview is what separates the two.
export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? BASE : "/",
  plugins: [react(), tailwindcss()],
  test: { environment: "node" },
}));
