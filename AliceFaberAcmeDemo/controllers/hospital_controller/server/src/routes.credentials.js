import acapy from "./acapy.js";
import express from "express";
import bodyParser from "body-parser";

const router = express.Router();
router.use(bodyParser.json());

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

    // 篩選 active / request 狀態的連線
    const activeConnections = conns.filter(
      (c) => c.state === "active" || c.state === "request"
    );

    res.json({
      ok: true,
      credentialDefinitionIds: credDefs,
      schemaIds: schemas,
      connections: activeConnections,
    });
  } catch (err) {
    console.error("init error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/credentials/send
 * 接收 Credential JSON，轉送給 Agent
 */
router.post("/send", async (req, res) => {
  try {
    const {
      ConnectionId,
      SchemaId,
      CredentialDefinitionId,
      CredentialAttributesObject,
    } = req.body;

    if (!ConnectionId || !SchemaId || !CredentialDefinitionId || !CredentialAttributesObject) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }

    // 組合 Credential JSON（對應 C# _handleValidSubmit）
    const credential = {
      comment: "string",
      credential_proposal: {
        "@type":
          "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/issue-credential/1.0/credential-preview",
        attributes: JSON.parse(CredentialAttributesObject),
      },
      schema_issuer_did: "",
      connection_id: ConnectionId,
      schema_version: "",
      schema_id: SchemaId,
      issuer_did: "",
      cred_def_id: CredentialDefinitionId,
      schema_name: "",
    };

    // 拆 SchemaId，例如：issuer:schemaName:version
    const schemaArr = SchemaId.split(":");
    if (schemaArr.length >= 4) {
      credential.schema_issuer_did = schemaArr[0];
      credential.schema_name = schemaArr[2];
      credential.schema_version = schemaArr[3];
    }

    // 拆 Credential Definition
    const credDefArr = CredentialDefinitionId.split(":");
    if (credDefArr.length >= 1) {
      credential.issuer_did = credDefArr[0];
    }

    // 呼叫 Agent 發送憑證（對應 C# 的 AgentService.SendCredential）
    const result = await acapy.sendCredential(credential);

    res.json({ ok: true, message: "Credential sent", result });
  } catch (err) {
    console.error("send credential error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;