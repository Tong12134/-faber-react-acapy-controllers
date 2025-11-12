// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connections from "./src/routes.connections.js";
import credentials from "./src/routes.credentials.js";
import proofs from "./src/routes.proofs.js";
import webhooks from "./src/webhooks.js";
import * as acapy from "./src/acapy.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 健康檢查與 agent 狀態
app.get("/api/health", (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
app.get("/api/agent/status", async (req, res) => {
  try {
    const r = await acapy.ping();
    res.json({ ok: true, data: r.data });
  } catch (e) {
    res.status(503).json({ ok: false, error: e.message });
  }
});

// API routes
app.use("/api/connections", connections);
app.use("/api/credentials", credentials);
app.use("/api/proofs", proofs);

// Webhooks（需在 ACA-Py 啟動時指定）
app.post("/webhooks/topic/:topic", webhooks);

const PORT = process.env.PORT || 5060; // 改為新的 port
app.listen(PORT, () => console.log(`[patient-controller] listening on :${PORT}`));
