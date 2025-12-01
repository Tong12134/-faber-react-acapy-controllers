// controllers/insurer-controller/server/src/routes.claimPreview.js

import express from "express"; // 1. 改用 import
import {
  credAttrsToEncounterDTO,
  previewClaimFromEncounter,
} from "./claimPreview.js"; // 2. 改用 import，並且記得加上 .js 副檔名

const router = express.Router();

// POST /api/claim/preview-from-hospital-credential
// body 期待長這樣：{ credentialAttrs: { hospital_id: "...", ... } }
router.post("/preview-from-hospital-credential", async (req, res) => {
  try {
    const rawAttrs = req.body.credentialAttrs || {};

    // rawAttrs 可以是：
    // - 直接的 { hospital_id: "HOSPITAL-001", ... }
    // - 或是 AnonCreds attrs { hospital_id: { raw: "...", encoded: "..." }, ... }
    // 這裡先支援「直接傳 string」版本，PoC 比較簡單
    const flattened = {};
    for (const [k, v] of Object.entries(rawAttrs)) {
      if (v && typeof v === "object" && "raw" in v) {
        flattened[k] = v.raw;
      } else {
        flattened[k] = v;
      }
    }

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

export default router; 