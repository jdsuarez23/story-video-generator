import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ─── Python Pipeline Proxy ──────────────────────────────────────────────────
  // Frontend calls /api/python/* → Express forwards to Python server on :8000
  // This avoids CORS completely (same-origin from the browser's perspective).
  app.use("/api/python", async (req, res) => {
    const subPath = req.url; // e.g. "/start-pipeline" or "/pipeline-status/123"
    const pythonUrl = `http://localhost:8000${subPath}`;
    console.log(`[Python Proxy] ${req.method} ${pythonUrl}`);
    try {
      const init: RequestInit = {
        method: req.method,
        headers: { "Content-Type": "application/json" },
      };
      if (req.method !== "GET" && req.method !== "HEAD") {
        init.body = JSON.stringify(req.body);
      }
      const pyRes = await fetch(pythonUrl, init);
      const contentType = pyRes.headers.get("content-type") || "";
      
      if (contentType.includes("application/json")) {
        const data = await pyRes.json();
        res.status(pyRes.status).json(data);
      } else {
        // Forward binary files (audio, video, etc) directly
        res.status(pyRes.status);
        res.setHeader("Content-Type", contentType);
        const arrayBuffer = await pyRes.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
      }
    } catch (err) {
      console.error("[Python Proxy] Error:", err);
      res.status(503).json({
        error: "Python server unavailable",
        message:
          "Asegúrate de que el servidor Python esté corriendo: " +
          "python -m uvicorn server.agents.api:app --reload --port 8000",
      });
    }
  });
  // ───────────────────────────────────────────────────────────────────────────

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`Python proxy active: /api/python/* → http://localhost:8000/*`);
  });
}

startServer().catch(console.error);
