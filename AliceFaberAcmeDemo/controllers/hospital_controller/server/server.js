import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import * as acapy from "./src/acapy.js";
import connections from "./src/routes.connections.js";
// import issue from "./src/routes.issue.js";
// import verify from "./src/routes.verify.js";
import credentialSchemas from "./src/routes.credentialSchemas.js";
import credentialDefinitions from "./src/routes.credentialDefinitions.js";
import credentials from "./src/routes.credentials.js";
import webhooks from "./src/webhooks.js";

console.log("[SERVER] I am", process.env.SERVICE_NAME || "unknown");
console.log("[SERVER] AGENT_URL =", process.env.AGENT_URL);

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// API
app.get("/api/health", (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
app.get("/api/agent/status", async (req, res) => {
  try {
    const r = await acapy.ping();
    res.json({ ok: true, data: r.data });
  } catch (e) {
    res.status(503).json({ ok: false, error: e.message });
  }
});

app.use("/api/connections", connections);
app.use("/api/credentialSchemas", credentialSchemas);
app.use("/api/credentialDefinitions", credentialDefinitions);
app.use("/api/credentials", credentials);

// Webhooks（請在 agent 參數加 --webhook-url 指到這個位址）
app.post("/webhooks/topic/:topic", webhooks);

// 靜態檔（生產或你想用 Express 直接服務 React）
// app.use(express.static(path.join(__dirname, "../client/dist")));
// app.get("*", (req, res) =>
//   res.sendFile(path.join(__dirname, "../client/dist/index.html"))
// );

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`[hospital-controller] listening on :${PORT}`));
