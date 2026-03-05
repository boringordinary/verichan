import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { db } from "./database";
import { auth } from "./auth";
import { clientsRouter } from "./routes/v1/clients";
import { sessionsRouter } from "./routes/v1/sessions";
import { verificationRouter } from "./routes/v1/verification";
import { reviewsRouter } from "./routes/v1/reviews";
import { verifyRouter } from "./routes/v1/verify";

const port = Bun.env.PORT ? parseInt(Bun.env.PORT) : 3000;

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
  .use(cors({
    origin: Bun.env.WEB_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }))
  .decorate("db", db)
  .use(betterAuthPlugin)
  .get("/", () => "verichan")
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  .use(clientsRouter)
  .use(sessionsRouter)
  .use(verificationRouter)
  .use(reviewsRouter)
  .use(verifyRouter)
  .listen(port);

console.log(`Server running at ${app.server?.url}`);
