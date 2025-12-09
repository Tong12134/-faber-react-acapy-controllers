// server/src/routes.credentials.js
import express from "express";
import * as acapy from "./acapy.js";

const router = express.Router();

/**
 * GET /api/credentials/init
 * 取得 CredentialDefinitions、Schemas、Connections
 */
router.get("/init", async (req, res) => {
  try {
    const [credDefs, schemas, conns] = await Promise.all([
      acapy.getCredentialDefinitions(),
      acapy.getSchemas(),
      acapy.getConnections(),
    ]);

    // 只保留 active / request 狀態的連線
    const activeConnections = (conns || []).filter(
      (c) => c.state === "active" || c.state === "request"
    );

    res.json({
      ok: true,
      credentialDefinitionIds: credDefs || [],
      schemaIds: schemas || [],
      connections: activeConnections,
    });
  } catch (err) {
    console.error("[credentials/init] error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/credentials/send
 * 接收 Credential JSON，轉送給 ACA-Py /issue-credential/send
 *
 * body 格式（沿用你原本前端）：
 * {
 *   "ConnectionId": "<connection_id>",
 *   "SchemaId": "<schema_id>",
 *   "CredentialDefinitionId": "<cred_def_id>",
 *   "CredentialAttributesObject": "[{ \"name\": \"name\", \"value\": \"Alice\" }, ...]"
 * }
 */
router.post("/send", async (req, res) => {
  try {
    const {
      ConnectionId,
      SchemaId,
      CredentialDefinitionId,
      CredentialAttributesObject,
    } = req.body;

    if (
      !ConnectionId ||
      !SchemaId ||
      !CredentialDefinitionId ||
      !CredentialAttributesObject
    ) {
      return res.status(400).json({
        ok: false,
        error:
          "Missing fields: ConnectionId / SchemaId / CredentialDefinitionId / CredentialAttributesObject",
      });
    }

    // 解析前端傳來的 attributes（它是一個 JSON 字串）
    let attrs;
    try {
      attrs = JSON.parse(CredentialAttributesObject);
      if (!Array.isArray(attrs)) {
        throw new Error("CredentialAttributesObject 必須是陣列");
      }
    } catch (e) {
      return res.status(400).json({
        ok: false,
        error: "CredentialAttributesObject 不是合法的 JSON 陣列",
      });
    }

    // 組成 ACA-Py v1 需要的 credential_proposal（裡面包 preview）
    const credentialProposal = {
      "@type":
        "https://didcomm.org/issue-credential/1.0/credential-preview",
      attributes: attrs.map((a) => ({
        name: a.name,
        value: String(a.value ?? ""),
      })),
    };

    // issue-credential v1 payload
    const payload = {
      connection_id: ConnectionId,
      cred_def_id: CredentialDefinitionId,
      schema_id: SchemaId, // 可選，但留著沒關係
      comment: "Hospital issues diagnosis credential",
      auto_issue: true,
      auto_remove: false,
      credential_proposal: credentialProposal, //  關鍵：用 credential_proposal，而不是 credential_preview
    };

    console.log("[credentials/send] sending to ACA-Py:", payload);

    const result = await acapy.sendCredential(payload);

    res.json({ ok: true, message: "Credential sent", result });
  } catch (err) {
    console.error("[credentials/send] error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
