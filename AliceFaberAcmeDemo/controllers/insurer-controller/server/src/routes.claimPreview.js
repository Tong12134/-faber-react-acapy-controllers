// controllers/insurer-controller/server/src/routes.claimPreview.js

import express from "express";
import {
  credAttrsToEncounterDTO,
  credAttrsToPolicyDTO,
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
    const {
      hospitalCredentialAttrs,
      policyCredentialAttrs,
      credentialAttrs, // 舊版仍然支援
    } = req.body || {};

    // 1) 取得醫院 VC 的 attrs（優先用新欄位，沒有就用舊的 credentialAttrs）
    const rawHospitalAttrs =
      hospitalCredentialAttrs || credentialAttrs || {};
    const hospitalFlattened = flattenAttrs(rawHospitalAttrs);
    const encounterDto = credAttrsToEncounterDTO(hospitalFlattened);

    // 2) 取得保單 VC 的 attrs（可能暫時沒有，就給空物件）
    const rawPolicyAttrs = policyCredentialAttrs || {};
    const policyFlattened = flattenAttrs(rawPolicyAttrs);
    const policyDto = credAttrsToPolicyDTO(policyFlattened);

    // 3) 丟進新版的試算邏輯（裡面會用模板組出條款說明）
    const preview = previewClaimFromEncounter(encounterDto, policyDto);

    res.json({
      ok: true,
      preview,
      // 如果前端要顯示，也可以把這兩個 DTO 一併回傳
      encounter: encounterDto,
      policy: policyDto,
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
 * body:
 *  {
 *    hospitalCredentialAttrs: {...},   // 醫院 VC attrs
 *    policyCredentialAttrs?: {...},    // 保單 VC attrs
 *    insuredId?: string,
 *    policyId?: string
 *  }
 */
router.post("/submit", async (req, res) => {
  try {
    const {
      hospitalCredentialAttrs,
      policyCredentialAttrs,
      credentialAttrs,     // 舊版相容用
      insuredId,
      policyId,
    } = req.body || {};

    // 相容：如果舊前端送的是 credentialAttrs，就當成 hospitalCredentialAttrs
    const hospitalAttrs = hospitalCredentialAttrs || credentialAttrs || null;

    if (!hospitalAttrs) {
      return res
        .status(400)
        .json({ ok: false, error: "hospitalCredentialAttrs / credentialAttrs is required" });
    }

    console.log(
      "[IS] [/submit] incoming body:",
      JSON.stringify(req.body, null, 2)
    );

    const claim = createClaim({
      credentialAttrs: hospitalAttrs,      // 給 claimStore
      policyCredentialAttrs,              // 可能為 undefined，沒關係
      insuredId,
      policyId,
    });

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
