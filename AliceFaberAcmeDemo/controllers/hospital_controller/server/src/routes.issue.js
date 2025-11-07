import acapy from "./acapy.js";
import express from "express";

const router = express.Router();

/**
 * 發診斷證明（示例）
 * body: { connection_id, subject_id, diagnosis, issued_at }
 */
router.post("/issue", async (req, res, next) => {
  try {
    const { connection_id, subject_id, diagnosis, issued_at } = req.body;

    // 這裡用 Indy V2（示例值）；實務要放你的 schema_id/cred_def_id
    const payload = {
      auto_issue: true,
      auto_remove: false,
      comment: "Hospital Diagnostic Credential",
      connection_id,
      filter: {
        indy: {
          schema_issuer_did: "NcYxiDXkpYi6ov5FcYDi1e",   // demo 值
          schema_name: "hospital_diagnostic",
          schema_version: "1.0",
          cred_def_id: "NcYxiDXkpYi6ov5FcYDi1e:3:CL:20:tag", // demo 值
          issuer_did: "NcYxiDXkpYi6ov5FcYDi1e"
        }
      },
      credential_preview: {
        "@type": "issue-credential/2.0/credential-preview",
        "attributes": [
          { "name": "subject_id", "value": subject_id || "alice-001" },
          { "name": "diagnosis",  "value": diagnosis  || "Common Cold" },
          { "name": "issued_at",  "value": issued_at  || new Date().toISOString() }
        ]
      }
    };

    const r = await acapy.post("/issue-credential-2.0/send", payload);
    res.json(r.data);
  } catch (e) {
    next(e);
  }
});

export default router;
