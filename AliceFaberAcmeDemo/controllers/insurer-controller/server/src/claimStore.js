// controllers/insurer-controller/server/src/claimStore.js

import {
  credAttrsToEncounterDTO,
  credAttrsToPolicyDTO,
  previewClaimFromEncounter,
} from "./claimPreview.js";

// 很簡單的 in-memory 儲存（重開 server 會清空）
const claims = [];
let seq = 1;

// helper：把 attrs 轉成單純 { key: raw }（支援 AnonCredAttr 或平面 map）
export function flattenAttrs(rawAttrs = {}) {
  const flat = {};
  for (const [k, v] of Object.entries(rawAttrs)) {
    if (v && typeof v === "object" && "raw" in v) {
      flat[k] = String(v.raw);
    } else {
      flat[k] = String(v);
    }
  }
  return flat;
}

/**
 * createClaim
 * 支援兩種呼叫方式：
 *
 * 1) 新版（建議）：
 *    createClaim({
 *      hospitalCredentialAttrs,
 *      policyCredentialAttrs,
 *      insuredId,
 *      policyId,
 *    })
 *
 * 2) 舊版（只有醫院 VC）：
 *    createClaim({
 *      credentialAttrs,
 *      insuredId,
 *      policyId,
 *    })
 */
export function createClaim({
  hospitalCredentialAttrs,
  policyCredentialAttrs,
  credentialAttrs, // 舊版相容：當成 hospitalCredentialAttrs 用
  insuredId,
  policyId,
} = {}) {
  // 1) 醫院 VC attrs（優先用 hospitalCredentialAttrs，沒有就用 credentialAttrs）
  const hospitalAttrs = hospitalCredentialAttrs || credentialAttrs || {};
  const flatHospital = flattenAttrs(hospitalAttrs);
  const encounterDTO = credAttrsToEncounterDTO(flatHospital);

  // 2) 保單 VC attrs（可能沒有）
  const flatPolicy = flattenAttrs(policyCredentialAttrs || {});
  const policyDTO = credAttrsToPolicyDTO(flatPolicy);

  console.log("[IS] [createClaim] encounterDTO =", encounterDTO);
  console.log("[IS] [createClaim] policyDTO    =", policyDTO);

  // 3) 用 Encounter + Policy 做試算
  const preview = previewClaimFromEncounter(encounterDTO, policyDTO);

  const claimId = `CLAIM-${String(seq++).padStart(6, "0")}`;
  const now = new Date().toISOString();

  const claim = {
    claimId,
    insuredId: insuredId || "UNKNOWN_INSURED",
    policyId: policyId || "POLICY-DEMO-001",
    status: "RECEIVED", // 之後可以改成 IN_REVIEW / APPROVED / DENIED / PAID...
    createdAt: now,
    updatedAt: now,

    // 一些方便列表顯示的欄位
    hospitalId: encounterDTO.hospitalId,
    hospitalName: encounterDTO.hospitalName,
    encounterId: encounterDTO.encounterId,
    encounterClass: encounterDTO.encounterClass,
    admissionDate: encounterDTO.admissionDate,
    dischargeDate: encounterDTO.dischargeDate,

    // 試算結果（已經吃到保單金額）
    preview,

    // 原始資料（之後想要轉 FHIR / 做 LLM 用得上）
    credentialAttrs: flatHospital,        // 保留原本名稱，表示醫院 VC
    encounterDTO,                         // 保留給「內部 Encounter DTO」顯示
    policyCredentialAttrs: flatPolicy,    // 新增：保單 VC 原始欄位
    policyDTO,                            // 新增：保單 DTO（之後想顯示條款可以用）
  };

  claims.push(claim);

  console.log("[claimStore] 新增一筆 claim:");
  console.log(JSON.stringify(claim, null, 2));

  return claim;
}

export function listClaims(insuredId) {
  if (!insuredId) return claims;
  return claims.filter((c) => c.insuredId === insuredId);
}

export function getClaim(claimId) {
  return claims.find((c) => c.claimId === claimId) || null;
}

export default {
  createClaim,
  listClaims,
  getClaim,
};
