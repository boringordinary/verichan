import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";
  const isTest = mode === "test";

  const plugins = [viteReact()];

  if (!isTest) {
    plugins.unshift(
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }) as ReturnType<typeof viteReact>
    );
    plugins.push(tailwindcss());
  }

  return {
    plugins,
    define: {
      "process.env": {},
    },
    test: {
      globals: true,
      environment: "happy-dom",
    },
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@": resolve(__dirname, "./src"),
        "@verichan/embed": resolve(__dirname, "../../packages/embed/src/index.ts"),
      },
    },
    server: {
      host: true,
      open: false,
      proxy: {
        "/api": {
          target: "http://localhost:1070",
          changeOrigin: true,
        },
        "/v1": {
          target: "http://localhost:1070",
          changeOrigin: true,
        },
      },
    },
    build: {
      minify: isProduction ? "esbuild" : undefined,
      esbuild: isProduction
        ? { drop: ["console", "debugger"] }
        : undefined,
      rollupOptions: {
        output: {
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
        },
      },
    },
  };
});
