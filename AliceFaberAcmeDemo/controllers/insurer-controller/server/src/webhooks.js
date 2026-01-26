// server/src/webhooks.js
import express from "express";
import * as acapy from "./acapy.js";
import { createClaim, listClaims } from "./claimStore.js";

const router = express.Router();

// Demo：固定 insuredId / policyId，之後可以從 connection / attrs 算
const DEMO_INSURED_ID = "patient-001";
const DEMO_POLICY_ID = "POLICY-DEMO-001";

/**
 * 小幫手：從一筆 proof exchange 取出 revealed attrs，建立 claim
 */
async function buildClaimFromProof(proofExId) {
  // 1) 抓完整 record
  const rec = await acapy.getProofRecord(proofExId);

  const proofReq =
    rec.presentation_request?.proof_request ||
    rec.presentation_request ||
    rec.proof_request ||
    null;

  const requestedProof = rec.presentation?.requested_proof || {};
  const revealedAttrs = requestedProof.revealed_attrs || {};
  const requestedAttrs = proofReq?.requested_attributes || null;

  if (!requestedAttrs) {
    console.warn(
      "[IS] verified proof but missing requested_attributes, presentation_request =",
      JSON.stringify(rec.presentation_request, null, 2)
    );
    return null;
  }

  // 2) 重建 { attrName: rawValue }
  const flatAttrs = {};
  for (const [referent, item] of Object.entries(revealedAttrs)) {
    const raw = item.raw;
    const reqItem = requestedAttrs[referent] || {};
    const attrName =
      reqItem.name ||
      (Array.isArray(reqItem.names) ? reqItem.names[0] : null) ||
      referent;

    flatAttrs[attrName] = raw;
  }

  console.log(
    "[IS] reconstructed attrs from proof:\n",
    JSON.stringify(flatAttrs, null, 2)
  );

  // 3) 用 encounter_global_id / encounter_id 做「不重複理賠」檢查
  const encounterId =
    flatAttrs.encounter_global_id || flatAttrs.encounter_id || null;

  if (encounterId) {
    const existing = (listClaims(DEMO_INSURED_ID) || []).find(
      (c) => c.encounterId === encounterId
    );
    if (existing) {
      console.warn(
        `[IS] claim for encounter ${encounterId} already exists as ${existing.claimId}, skip creating new claim`
      );
      return existing;
    }
  }

  // 4) 建一筆 claim
  const claim = createClaim({
    credentialAttrs: flatAttrs,
    insuredId: DEMO_INSURED_ID,
    policyId: DEMO_POLICY_ID,
  });

  console.log("[IS] created claim from verified proof:", claim.claimId);
  return claim;
}

/**
 * Webhook endpoint
 */
router.post("/topic/:topic", async (req, res) => {
  const topic = req.params.topic;
  const body = req.body;

  console.log(`[IS] Webhook: ${topic}`);
  console.log(JSON.stringify(body, null, 2));

  try {
    if (topic === "present_proof") {
      const proofExId =
        body.presentation_exchange_id ||
        body.pres_ex_id ||
        body._id ||
        body.id;

      const state = body.state;
      const verifiedFlag = body.verified; // "true" / "false" / undefined

      console.log(
        `[IS] present_proof webhook state=${state}, verified=${verifiedFlag}, id=${proofExId}`
      );

      // 1) 如果還在 presentation_received，就（選擇性）手動驗證一次
      if (state === "presentation_received") {
        try {
          const verifyRes = await acapy.verifyProofPresentation(proofExId);
          console.log(
            "[IS] verifyProofPresentation result:",
            JSON.stringify(verifyRes, null, 2)
          );
        } catch (e) {
          console.error("[IS] verify presentation failed:", e.message);
        }

        // 驗證完之後 ACA-Py 會再發一次 state=verified 的 webhook
        return res.status(200).send("ok");
      }

      // 2) 無論 verified 是 true 還是 false，state=verified 時都把完整 record 抓出來看
      if (state === "verified") {
        let rec;
        try {
          rec = await acapy.getProofRecord(proofExId);
          console.log(
            "[IS] full proof record from getProofRecord():",
            JSON.stringify(rec, null, 2)
          );
        } catch (e) {
          console.error(
            "[IS] getProofRecord error in verified state:",
            e.message
          );
          return res.status(200).send("ok");
        }

        // 🔍 這裡是 ACA-Py 檢查結果：為什麼 verified=false 就看這裡
        console.log(
          "[IS] verified flag in record =",
          rec.verified,
          "presentation_error =",
          rec.presentation_error,
          "verified_msgs =",
          JSON.stringify(rec.verified_msgs || [], null, 2)
        );

        // 如果還是 false，就不要建 claim，但至少 log 出具體原因
        if (String(rec.verified) !== "true") {
          console.warn(
            "[IS] state=verified but verified=false, 不建立 claim。原因見上方 presentation_error / verified_msgs。"
          );
          return res.status(200).send("ok");
        }

        // === 只有 verified === true 才重建 attrs & 建 claim ===

        const proofReq =
          rec.presentation_request?.proof_request ||
          rec.presentation_request ||
          rec.proof_request ||
          null;

        const requestedProof = rec.presentation?.requested_proof || {};
        const revealedAttrs = requestedProof.revealed_attrs || {};

        const requestedAttrs =
          proofReq?.requested_attributes ||
          rec.presentation_request?.requested_attributes ||
          null;

        if (!requestedAttrs) {
          console.warn(
            "[IS] verified proof but missing requested_attributes, presentation_request =",
            JSON.stringify(rec.presentation_request, null, 2)
          );
        } else {
          const flatAttrs = {};

          for (const [referent, item] of Object.entries(revealedAttrs)) {
            const raw = item.raw;
            const reqItem = requestedAttrs[referent] || {};
            const attrName =
              reqItem.name ||
              (Array.isArray(reqItem.names) ? reqItem.names[0] : null) ||
              referent;

            flatAttrs[attrName] = raw;
          }

          console.log(
            "[IS] reconstructed attrs from proof:\n",
            JSON.stringify(flatAttrs, null, 2)
          );

          const claim = createClaim({
            credentialAttrs: flatAttrs,
            insuredId: DEMO_INSURED_ID,
            policyId: DEMO_POLICY_ID,
          });

          console.log(
            "[IS] created claim from verified proof:",
            claim.claimId
          );
        }
      }
    }
  } catch (err) {
    console.error("[IS] webhook handler error:", err.message);
  }

  res.status(200).send("ok");
});

export default router;
