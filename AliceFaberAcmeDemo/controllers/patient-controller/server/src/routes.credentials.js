// server/src/routes.credentials.js
import express from "express";
import * as acapy from "./acapy.js";

const router = express.Router();

/**
 * 初始化頁面所需資料（Connections / Schemas / Credential Definitions）
 */
router.get("/init", async (req, res) => {
  try {
    const [connections, schemaIds, credentialDefinitionIds] = await Promise.all([
      acapy.getConnections(),
      acapy.getSchemas(),
      acapy.getCredentialDefinitions(),
    ]);
    res.json({ ok: true, connections, schemaIds, credentialDefinitionIds });
  } catch (err) {
    console.error("init error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * 發送 Credential
 */
router.post("/send", async (req, res) => {
  try {
    const result = await acapy.sendCredential(req.body);
    res.json({ ok: true, result });
  } catch (err) {
    console.error("send credential error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/credentials
 * 取得已儲存的 credentials，並附上 issuer DID + 名稱
 */
router.get("/", async (req, res) => {
  try {
    const rawCreds = await acapy.getCredentials();

    const ISSUER_LABELS = {
      "QWTxizRo9A1tWdEPYkFPHe": "Hospital",
    };

    const credentials = rawCreds.map((c) => {
      const issuerDid = (c.cred_def_id || "").split(":")[0];
      const issuerLabel = ISSUER_LABELS[issuerDid] || "Unknown Issuer";

      return {
        id: c.cred_id || c.referent,
        schemaId: c.schema_id,
        credDefId: c.cred_def_id,
        issuerDid,
        issuerLabel,
        attrs: c.attrs || {},
      };
    });

    res.json({ ok: true, credentials });
  } catch (err) {
    console.error("[/api/credentials] error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});


export default router;
