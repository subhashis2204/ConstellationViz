import { defineConfig } from "vite";

const isGithubPages = process.env.DEPLOY_TARGET === "github";

export default defineConfig({
  base: isGithubPages ? "/ConstellationViz/" : "/",
});
