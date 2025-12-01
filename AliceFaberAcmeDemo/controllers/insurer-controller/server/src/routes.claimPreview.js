// controllers/insurer-controller/server/src/routes.claimPreview.js

import express from "express";
import {
  credAttrsToEncounterDTO,
  previewClaimFromEncounter,
} from "./claimPreview.js";
import {
  createClaim,
  listClaims,
  getClaim,
  flattenAttrs,
} from "./claimStore.js";

const router = express.Router();

/**
 * 1) 試算理賠（不建檔）
 * POST /api/claim/preview-from-hospital-credential
 * body: { credentialAttrs: { ... } }
 */
router.post("/preview-from-hospital-credential", async (req, res) => {
  try {
    const rawAttrs = req.body.credentialAttrs || {};
    const flattened = flattenAttrs(rawAttrs);

    const dto = credAttrsToEncounterDTO(flattened);
    const preview = previewClaimFromEncounter(dto);

    res.json({
      ok: true,
      preview,
    });
  } catch (err) {
    console.error("[claim preview] error:", err);
    res.status(500).json({
      ok: false,
      error: err.message || String(err),
    });
  }
});

/**
 * 2) 送出正式理賠申請
 * POST /api/claim/submit
 * body: { credentialAttrs: {...}, insuredId?: string, policyId?: string }
 */
router.post("/submit", async (req, res) => {
  try {
    const { credentialAttrs, insuredId, policyId } = req.body || {};

    if (!credentialAttrs) {
      return res
        .status(400)
        .json({ ok: false, error: "credentialAttrs is required" });
    }

    const claim = createClaim({ credentialAttrs, insuredId, policyId });

    res.json({
      ok: true,
      claim,
    });
  } catch (err) {
    console.error("[claim submit] error:", err);
    res.status(500).json({
      ok: false,
      error: err.message || String(err),
    });
  }
});

/**
 * 3) 列出某個 insured 的所有 claims
 * GET /api/claim/list?insuredId=patient-001
 */
router.get("/list", async (req, res) => {
  try {
    const insuredId = req.query.insuredId;
    const all = listClaims(insuredId);

    // 列表只回比較精簡的欄位
    const items = all.map((c) => ({
      claimId: c.claimId,
      insuredId: c.insuredId,
      policyId: c.policyId,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      hospitalName: c.hospitalName,
      admissionDate: c.admissionDate,
      dischargeDate: c.dischargeDate,
      estimatedPayout: c.preview?.totalPayout ?? 0,
    }));

    res.json({ ok: true, claims: items });
  } catch (err) {
    console.error("[claim list] error:", err);
    res.status(500).json({
      ok: false,
      error: err.message || String(err),
    });
  }
});

/**
 * 4) 單一 claim 詳細
 * GET /api/claim/:claimId
 */
router.get("/:claimId", async (req, res) => {
  try {
    const { claimId } = req.params;
    const claim = getClaim(claimId);

    if (!claim) {
      return res.status(404).json({ ok: false, error: "Claim not found" });
    }

    res.json({ ok: true, claim });
  } catch (err) {
    console.error("[claim get] error:", err);
    res.status(500).json({
      ok: false,
      error: err.message || String(err),
    });
  }
});

export default router;
