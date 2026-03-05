import { Elysia } from "elysia";
import { db } from "./database";

const app = new Elysia()
  .decorate("db", db)
  .get("/", () => "chanid")
  .listen(3000);

console.log(`Server running at ${app.server?.url}`);
