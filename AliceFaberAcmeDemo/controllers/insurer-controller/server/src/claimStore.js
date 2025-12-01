// controllers/insurer-controller/server/src/claimStore.js

import {
  credAttrsToEncounterDTO,
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

export function createClaim({ credentialAttrs, insuredId, policyId }) {
  const flatAttrs = flattenAttrs(credentialAttrs);
  const dto = credAttrsToEncounterDTO(flatAttrs);
  const preview = previewClaimFromEncounter(dto);

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
    hospitalId: dto.hospitalId,
    hospitalName: dto.hospitalName,
    encounterId: dto.encounterId,
    encounterClass: dto.encounterClass,
    admissionDate: dto.admissionDate,
    dischargeDate: dto.dischargeDate,

    // 試算結果
    preview,

    // 原始資料（之後想要轉 FHIR / 做 LLM 用得上）
    credentialAttrs: flatAttrs,
    encounterDTO: dto,
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

// 選擇性：如果你習慣用 import default，可以加這行
export default {
  createClaim,
  listClaims,
  getClaim,
};