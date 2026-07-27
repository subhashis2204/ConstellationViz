import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// Project Pages URL: https://<user>.github.io/<repo>/
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const base =
  repoName != null
    ? `/${repoName}/`
    : process.env.NODE_ENV === "production"
      ? "/ConstellationViz/"
      : "/";

export default defineConfig({
  base,
  plugins: [tailwindcss()],
});
