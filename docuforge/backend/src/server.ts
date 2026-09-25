import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { ENV } from "./config/env";
import { connectDatabase, getConnectionState } from "./config/database";

import generateRouter from "./routes/generate";
import historyRouter from "./routes/history";
import documentsRouter from "./routes/documents";
import downloadRouter from "./routes/download";
import preferencesRouter from "./routes/preferences";
import authRouter from "./routes/auth";
import aiChatRouter from "./ai-chat/routes/aiChat";

const app = express();


// ─── Security & middleware ─────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);  

app.use(
  cors({
    origin: [ENV.FRONTEND_URL, "https://docuforge1-ai.vercel.app", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(morgan(ENV.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));



// ─── Health check ──────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "docucraft-api",
    db: getConnectionState(),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ─── API routes ────────────────────────────────────────────────────
app.use("/api/auth", authRouter);

app.use("/api/generate", generateRouter);

app.use("/api/history", historyRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/download", downloadRouter);
app.use("/api/preferences", preferencesRouter);
app.use("/api/ai-chat", aiChatRouter);


// ─── 404 handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
  });
});

// ─── Global error handler ──────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[Server Error]", err);
    res.status(500).json({
      success: false,
      error:
        ENV.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
    });
  }
);

// ─── Boot sequence ─────────────────────────────────────────────────
function boot() {
  app.listen(ENV.PORT, () => {
    console.log(`DocuCraft API listening at http://localhost:${ENV.PORT}`);
  });

  // Keep routes available while MongoDB is starting or offline.
  connectDatabase().catch((err) => {
    console.error("[Boot] MongoDB connection failed:", err);
  });
}

boot();

export default app;
