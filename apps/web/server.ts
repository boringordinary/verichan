import { serve } from "bun";

const port = Bun.env.PORT ? parseInt(Bun.env.PORT) : 5173;
const publicDir = "./dist";

serve({
  port,
  async fetch(req: Request) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Health check
    if (path === "/api/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          timestamp: new Date().toISOString(),
          service: "verichan-web",
          uptime: process.uptime(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Security: prevent directory traversal
    if (path.includes("..")) {
      return new Response("Not Found", { status: 404 });
    }

    // Try to serve the exact file
    const file = Bun.file(`${publicDir}${path}`);
    if (await file.exists()) {
      return new Response(file, {
        headers: {
          ...(shouldCache(path) && {
            "Cache-Control": "public, max-age=31536000, immutable",
          }),
        },
      });
    }

    // SPA fallback for navigation requests
    const accepts = req.headers.get("accept") ?? "";
    const secFetchDest = req.headers.get("sec-fetch-dest") ?? "";
    const secFetchMode = req.headers.get("sec-fetch-mode") ?? "";

    const isDocumentRequest =
      req.method === "GET" &&
      (secFetchDest === "document" ||
        secFetchMode === "navigate" ||
        (!path.includes(".") && accepts.includes("text/html")));

    if (isDocumentRequest) {
      const rootIndex = Bun.file(`${publicDir}/index.html`);
      if (await rootIndex.exists()) {
        return new Response(rootIndex, {
          headers: {
            "Content-Type": "text/html",
            "Cache-Control": "no-store, must-revalidate",
          },
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

function shouldCache(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase();
  const cacheableExtensions = [
    "js", "css", "png", "jpg", "jpeg", "gif", "svg", "ico",
    "woff", "woff2", "ttf", "otf",
  ];
  return cacheableExtensions.includes(ext || "");
}

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
