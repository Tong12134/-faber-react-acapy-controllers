// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connections from "./src/routes.connections.js";
import proofs from "./src/routes.proofs.js";
import credentialSchemas from "./src/routes.credentialSchemas.js";
import credentialDefinitions from "./src/routes.credentialDefinitions.js";
import credentials from "./src/routes.credentials.js";
import webhooks from "./src/webhooks.js";
import * as acapy from "./src/acapy.js";

console.log("[SERVER] I am", process.env.SERVICE_NAME || "unknown");
console.log("[SERVER] AGENT_URL =", process.env.AGENT_URL);

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
app.use("/api/proofs", proofs);
app.use("/api/credentialSchemas", credentialSchemas);
app.use("/api/credentialDefinitions", credentialDefinitions);
app.use("/api/credentials", credentials);

// Webhooks（需在 ACA-Py 啟動時指定）
app.post("/webhooks/topic/:topic", webhooks);

const PORT = process.env.PORT || 5070; 
app.listen(PORT, async () => {
  console.log(`[insurer-controller] listening on :${PORT}`);

  try {
    const { schemaId, credDefId } = await ensureInsurerSchemaAndCredDef();
    console.log("[insurer-controller] Ready with schema:", schemaId);
    console.log("[insurer-controller] Ready with cred def:", credDefId);
  } catch (e) {
    console.error("[insurer-controller] schema init error:", e.message);
  }
});