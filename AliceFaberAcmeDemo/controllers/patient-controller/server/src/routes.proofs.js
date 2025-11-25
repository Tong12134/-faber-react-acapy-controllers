// server/src/routes.proofs.js
import express from "express";
import * as acapy from "./acapy.js"; //  保持不變

const router = express.Router();

/**
 * 取得所有 Proof Requests
 */
router.get("/", async (req, res) => {
  try {
    
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

// POST /api/proofs/:id/accept  → 按下 Accept 時
router.post("/:id/accept", async (req, res) => {
  try {
    const data = await acapy.sendProofPresentation(req.params.id);
    res.json({ ok: true, data });
  } catch (err) {
    console.error("[PS] [POST accept proof] error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/proofs/:id/decline  → 按下 Decline 時
router.post("/:id/decline", async (req, res) => {
  try {
    const data = await acapy.declineProofRequest(
      req.params.id,
      req.body?.description
    );
    res.json({ ok: true, data });
  } catch (err) {
    console.error("[PS] [POST decline proof] error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
