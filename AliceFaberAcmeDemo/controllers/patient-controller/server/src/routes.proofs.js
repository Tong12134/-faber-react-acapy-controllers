// server/src/routes.proofs.js  （patient-controller）
import express from "express";
import * as acapy from "./acapy.js";

const router = express.Router();

/**
 * 取得所有 Proof Requests (role=prover, state=request_received)
 * GET /api/proofs
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

/**
 * 取得單一 proof 的詳細資訊（主要是 requested_attributes 給前端顯示）
 * GET /api/proofs/:id/detail
 */
router.get("/:id/detail", async (req, res) => {
  try {
    const proofExId = req.params.id;
    const rec = await acapy.getProofRecord(proofExId);

    const proofReq =
      rec.presentation_request?.proof_request ||
      rec.presentation_request ||
      rec.proof_request ||
      null;

    const requestedAttrs = proofReq?.requested_attributes || {};

    const attrs = Object.entries(requestedAttrs).map(
      ([referent, item]) => ({
        referent,
        name:
          item.name ||
          (Array.isArray(item.names) ? item.names[0] : referent),
      })
    );

    res.json({
      ok: true,
      proof: {
        id:
          rec.presentation_exchange_id ||
          rec.pres_ex_id ||
          rec.id,
        connection_id: rec.connection_id,
        state: rec.state,
        requestedAttrs: attrs,
      },
    });
  } catch (err) {
    console.error(
      "❌ [PS] GET /api/proofs/:id/detail error:",
      err.message
    );
    res.status(500).json({
      ok: false,
      error: err.response?.data || err.message,
    });
  }
});

/**
 * 使用者按「送出 ZKP」時呼叫
 * POST /api/proofs/:id/accept
 * body: { revealAttrNames?: string[] }  // 要揭露的欄位名稱（encounter_class ...）
 */
// POST /api/proofs/:id/accept  → 按下「確認送出 ZKP」時
router.post("/:id/accept", async (req, res) => {
  try {
    const selectedReferents = req.body?.selectedReferents;
    const data = await acapy.sendProofPresentation(
      req.params.id,
      selectedReferents
    );
    res.json({ ok: true, data });
  } catch (err) {
    console.error("[PS] [POST accept proof] error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});


// 取得某一筆 proof record 可用的 credentials（用來顯示整張 VC）
router.get("/:id/credentials", async (req, res) => {
  try {
    const results = await acapy.getProofCredentials(req.params.id);
    res.json({ ok: true, results });
  } catch (err) {
    console.error(
      "[PS] [GET /api/proofs/:id/credentials] error:",
      err.message
    );
    res.status(500).json({ ok: false, error: err.message });
  }
});


/**
 * 使用者按「拒絕」時
 * POST /api/proofs/:id/decline
 */
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
