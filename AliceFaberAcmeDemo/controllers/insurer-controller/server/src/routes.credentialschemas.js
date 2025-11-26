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

/**
 * POST /api/schemas
 * 建立一個新的 Schema
 * body: { name: string, version: string, attributes: string[] }
 */
router.post("/", async (req, res) => {
  try {
    const { name, version, attributes } = req.body;

    if (!name || !version || !Array.isArray(attributes) || attributes.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "name、version、attributes 為必填，且 attributes 需為非空陣列",
      });
    }

    const data = await acapy.createSchema({ name, version, attributes });
    res.json({ ok: true, result: data });
  } catch (err) {
    console.error("create schema error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});


export default router;
