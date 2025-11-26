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
    console.log(" ACA-Py returned IDs:", ids);
    res.json({ ok: true, defIds: ids });
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
    const rawId = req.params.id;
    const id = decodeURIComponent(rawId); 
    //const id = req.params.id;
    console.log("📩  Received definition ID:", id);
    const data = await acapy.getCredentialDefinition(id);
    res.json({ ok: true, result: data });
  } catch (err) {
    console.error("get definition error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/definitions
 * 建立新的 Credential Definition
 * body: { schemaId: string, tag?: string, supportRevocation?: boolean }
 */
router.post("/", async (req, res) => {
  try {
    const {
      schemaId,
      tag = "default",
      supportRevocation = false,
    } = req.body;

    if (!schemaId) {
      return res
        .status(400)
        .json({ ok: false, error: "schemaId 為必填" });
    }

    const data = await acapy.createCredentialDefinition({
      schemaId,
      tag,
      supportRevocation,
    });

    res.json({ ok: true, result: data });
  } catch (err) {
    console.error("create definition error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
