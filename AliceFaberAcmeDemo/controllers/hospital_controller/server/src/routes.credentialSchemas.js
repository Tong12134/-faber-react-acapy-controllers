// server/src/routes.schemas.js
import express from "express";
import * as acapy from "./acapy.js";

const router = express.Router();

/**
 * GET /api/schemas
 * 取得所有 Schema IDs（對應 ACA-Py /schemas/created）
 */
router.get("/", async (req, res) => {
  try {
    const schemaIds = await acapy.getSchemas();
    res.json({ ok: true, schemaIds });
  } catch (err) {
    console.error("get schemas error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/schemas/:id
 * 取得單一 Schema 詳細資料（對應 ACA-Py /schemas/{id}）
 */
router.get("/:id", async (req, res) => {
  try {
    const schemaId = req.params.id;
    const data = await acapy.getSchema(schemaId);
    res.json({ ok: true, result: data });
  } catch (err) {
    console.error("get schema error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
