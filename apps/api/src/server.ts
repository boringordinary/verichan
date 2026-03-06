import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { db } from "./database";
import { auth } from "./auth";
import { clientsRouter } from "./routes/v1/clients";
import { sessionsRouter } from "./routes/v1/sessions";
import { verificationRouter } from "./routes/v1/verification";
import { reviewsRouter } from "./routes/v1/reviews";
import { verifyRouter } from "./routes/v1/verify";

const port = Bun.env.PORT ? parseInt(Bun.env.PORT) : 1070;

const betterAuthPlugin = new Elysia({ name: "better-auth" })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers });
        if (!session) return status(401);
        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });

const app = new Elysia()
  .use(openapi({
    documentation: {
      info: {
        title: "Verichan API",
        version: "1.0.0",
        description: "API for managing verification sessions, reviews, and clients.",
      },
      tags: [
        { name: "System", description: "Operational and health endpoints." },
        { name: "Clients", description: "Client and API key management." },
        { name: "Sessions", description: "Verification session lifecycle APIs." },
        { name: "Verification", description: "Document, selfie, and liveness submission APIs." },
        { name: "Reviews", description: "Manual review queue and decision APIs." },
        { name: "Hosted Verify", description: "Hosted verification session lookup endpoints." },
      ],
    },
  }))
  .use(cors({
    origin: Bun.env.WEB_URL || "http://localhost:1069",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }))
  .decorate("db", db)
  .use(betterAuthPlugin)
  .get("/", () => "verichan", {
    detail: {
      hide: true,
    },
  })
  .get(
    "/health",
    () => ({
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
    {
      detail: {
        summary: "Health check",
        description: "Returns the API service health status and current timestamp.",
        tags: ["System"],
      },
    },
  )
  .use(clientsRouter)
  .use(sessionsRouter)
  .use(verificationRouter)
  .use(reviewsRouter)
  .use(verifyRouter)
  .listen(port);

console.log(`Worker ${process.pid} running at ${app.server?.url}`);
