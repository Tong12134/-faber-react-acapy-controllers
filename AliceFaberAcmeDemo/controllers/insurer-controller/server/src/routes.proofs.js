// server/src/routes.proofs.js
import express from "express";
import * as acapy from "./acapy.js"; //  保持不變

const router = express.Router();

/**
 * 取得所有 Proof Requests
 */
router.get("/", async (req, res) => {
  try {
    // 呼叫你在 acapy.js 定義的 getProofs()
    const results = await acapy.getProofs();
    res.json({ ok: true, results });
  } catch (err) {
    console.error("❌ [Proofs API] Failed to fetch:", err.message);
    res.status(500).json({
      ok: false,
      error: err.response?.data || err.message,
    });
  }
});

// 發送 proof request
router.post("/request", async (req, res) => {
  try {
    const result = await acapy.sendProofRequest(req.body);
    res.json({ ok: true, result });
  } catch (err) {
    console.error("❌ [POST proof request] failed:", err.message);
    res.status(500).json({
      ok: false,
      error: err.response?.data || err.message,
    });
  }
});

// 刪除一筆 proof record
router.delete("/:id", async (req, res) => {
  try {
    await acapy.deleteProofRecord(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("[IS] [DELETE proof] error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});


export default router;
