// controllers/insurer-controller/server/src/claimPreview.js

// ==== 1. Encounter VC → DTO ====
export function credAttrsToEncounterDTO(attrs) {
  const get = (name) => (attrs[name] !== undefined ? String(attrs[name]) : null);

  return {
    // 這裡用 provider_org_id 當 hospitalId
    hospitalId: get("provider_org_id"),
    hospitalName: get("provider_org_name"),

    // 病人資訊
    patientId: get("patient_id"),
    patientName: get("patient_name"),
    patientBirthdate: get("patient_birthdate_dateint"),

    // Encounter 基本資訊
    encounterId: get("encounter_id"),
    encounterClass: get("encounter_class") || "UNKNOWN",
    encounterDepartment: get("encounter_department"),
    encounterDate: get("encounter_date"),

    // 時間：用這兩個算住院天數
    admissionDate: get("admission_date"),
    dischargeDate: get("discharge_date"),

    // 診斷
    diagnosisSystem: get("diagnosis_system"),
    diagnosisCode: get("diagnosis_code"),
    diagnosisDisplay: get("diagnosis_display"),

    // 手術
    procedureCode: get("procedure_code"),
    procedureDisplay: get("procedure_display"),

    // 其他 metadata
    fhirBundleId: get("fhir_bundle_id"),
    fhirBundleHash: get("fhir_bundle_hash"),
    recordType: get("record_type"),
    timestamp: get("timestamp"),
  };
}

// admissionDate / dischargeDate 預期類似 "2025-06-01" 或 ISO 日期字串
function calcStayDays(admissionDate, dischargeDate) {
  if (!admissionDate) return 0;

  const start = new Date(admissionDate);
  const end = dischargeDate ? new Date(dischargeDate) : start;

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }

  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return 0; // 避免出院日比入院日早

  const dayMs = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor(diffMs / dayMs);

  // 少於 1 天也算住 1 天（例如 10/1 下午住進、10/2 早上出院）
  if (diffDays <= 0) return 1;

  // 其他情況就是實際相差的整天數
  return diffDays;
}

// ==== 2. Policy VC → DTO ====

export function credAttrsToPolicyDTO(attrs) {
  const get = (name) =>
    attrs[name] !== undefined ? String(attrs[name]) : null;
  const getNum = (name) =>
    attrs[name] !== undefined ? Number(attrs[name]) || 0 : 0;

  return {
    policyId: get("policy_id"),
    productName: get("product_name"),
    coverageType: get("coverage_type"),
    coverageStartDate: get("coverage_start_date"),
    coverageEndDate: get("coverage_end_date"),
    hospitalDailyCash: getNum("hospital_daily_cash"),
    surgeryBenefit: getNum("surgery_benefit"),
  };
}

// ==== 3. 用「模板」產出條款說明文字 ====

export function buildPolicyRuleDescriptions(policy) {
  const lines = [];

  if (policy.hospitalDailyCash > 0) {
    lines.push(
      `規則 1：住院日額（住院類型為 INPATIENT，且住滿至少 1 天，每日給付 ${policy.hospitalDailyCash} 元）`
    );
  }

  if (policy.surgeryBenefit > 0) {
    lines.push(
      `規則 2：若有手術紀錄，給付手術一次金 ${policy.surgeryBenefit} 元`
    );
  }

  if (!lines.length) {
    lines.push("目前保單未設定任何試算規則或給付金額。");
  }

  return lines;
}

// ==== 4. 試算理賠：依據保單 VC 的數值來算 ====

export function previewClaimFromEncounter(dto, policyConfig = {}) {
  let total = 0;
  const reasons = [];

  // 從 policyConfig 讀金額，沒有就當 0
  const hospitalDailyCash =
    Number(policyConfig.hospitalDailyCash ?? policyConfig.hospital_daily_cash ?? 0) || 0;
  const surgeryBenefit =
    Number(policyConfig.surgeryBenefit ?? policyConfig.surgery_benefit ?? 0) || 0;

  // 規則 1：住院日額
  if (dto.encounterClass === "INPATIENT") {
    const days = calcStayDays(dto.admissionDate, dto.dischargeDate);

    if (days >= 1 && hospitalDailyCash > 0) {
      const perDay = hospitalDailyCash;
      const amount = days * perDay;
      total += amount;
      reasons.push(
        `住院 ${days} 天，符合日額給付，每日 ${perDay} 元，共 ${amount} 元`
      );
    } else if (days >= 1 && hospitalDailyCash === 0) {
      reasons.push(`住院 ${days} 天，但保單未設定住院日額金額（hospital_daily_cash）。`);
    } else {
      reasons.push(`住院未滿 1 天（${days} 天），不符合日額給付門檻`);
    }
  } else {
    reasons.push(
      `此次就醫類型為 ${dto.encounterClass}，非住院，不適用住院日額給付`
    );
  }

  // 規則 2：手術一次金
  if (dto.procedureCode && dto.procedureCode.trim() !== "") {
    if (surgeryBenefit > 0) {
      const amount = surgeryBenefit;
      total += amount;
      reasons.push(
        `有手術紀錄（${dto.procedureCode} ${dto.procedureDisplay || ""}），給付手術一次金 ${amount} 元`
      );
    } else {
      reasons.push(
        `有手術紀錄，但保單未設定手術一次金金額（surgery_benefit）。`
      );
    }
  } else {
    reasons.push("無手術紀錄，無手術一次金給付");
  }

  // 額外回傳：policy 規則描述（給前端顯示條款）
  const policyRules = buildPolicyRuleDescriptions({
    hospitalDailyCash,
    surgeryBenefit,
  });

  return {
    eligible: total > 0,
    totalPayout: total,
    breakdown: reasons,
    policyRules, // 前端可以顯示「這張保單的給付規則」
  };
}
