// server/src/routes.credentialDefinitions.js
import express from "express";
import * as acapy from "./acapy.js";

const router = express.Router();

/**
 * GET /api/definitions
 * 取得所有 Credential Definition IDs
 */
router.get("/", async (req, res) => {
  try {
    const ids = await acapy.getCredentialDefinitions();
    res.json({ ok: true, credentialDefinitionIds: ids });
  } catch (err) {
    console.error("get definitions error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/definitions/:id
 * 取得特定 Credential Definition 的詳細資料
 */
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = await acapy.getCredentialDefinition(id);
    res.json({ ok: true, result: data });
  } catch (err) {
    console.error("get definition error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
