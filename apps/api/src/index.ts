import { Elysia } from "elysia";
import { db } from "./database";

const port = Bun.env.PORT ? parseInt(Bun.env.PORT) : 3000;

const app = new Elysia()
  .decorate("db", db)
  .get("/", () => "chanid")
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .listen(port);

console.log(`Server running at ${app.server?.url}`);
