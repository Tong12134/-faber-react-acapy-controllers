// controllers/insurer-controller/server/src/claimPreview.js
// 「mapper + 試算邏輯」

export function credAttrsToEncounterDTO(attrs) {
  const get = (name) => (attrs[name] !== undefined ? String(attrs[name]) : null);

  return {
    hospitalId: get("hospital_id"),
    encounterId: get("encounter_id"),

    encounterClass: get("encounter_class") || "UNKNOWN",
    encounterDepartment: get("encounter_department"),

    encounterDate: get("encounter_date"),
    admissionDate: get("admission_date"),
    dischargeDate: get("discharge_date"),

    diagnosisSystem: get("diagnosis_system"),
    diagnosisCode: get("diagnosis_code"),
    diagnosisDisplay: get("diagnosis_display"),

    procedureCode: get("procedure_code"),
    procedureDisplay: get("procedure_display"),
  };
}

// admissionDate / dischargeDate 預期類似 "2025-06-01" 或 ISO 日期字串
// 這是一個內部輔助函式，不用 export 也沒關係
function calcStayDays(admissionDate, dischargeDate) {
  if (!admissionDate) return 0;

  const start = new Date(admissionDate);
  // 若沒有 dischargeDate，先當成只住一天
  const end = dischargeDate ? new Date(dischargeDate) : start;

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }

  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return 0; // 避免出院日比入院日小

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays + 1; // 同一天住院算 1 天
}


export function previewClaimFromEncounter(dto) {
  let total = 0;
  const reasons = [];

  // 規則 1：住院日額（INPATIENT && 住院 >= 2 天，每天 2000）
  if (dto.encounterClass === "INPATIENT") {
    const days = calcStayDays(dto.admissionDate, dto.dischargeDate);

    if (days >= 2) {
      const perDay = 2000;
      const amount = days * perDay;
      total += amount;
      reasons.push(`住院 ${days} 天，符合日額給付，每日 ${perDay} 元，共 ${amount} 元`);
    } else {
      reasons.push(`住院未滿 2 天（${days} 天），不符合日額給付門檻`);
    }
  } else {
    reasons.push(
      `此次就醫類型為 ${dto.encounterClass}，非住院，不適用住院日額給付`
    );
  }

  // 規則 2：有手術碼就給一次金 10000
  if (dto.procedureCode && dto.procedureCode.trim() !== "") {
    const surgeryAmount = 10000;
    total += surgeryAmount;
    reasons.push(
      `有手術紀錄（${dto.procedureCode} ${dto.procedureDisplay || ""}），給付手術一次金 ${surgeryAmount} 元`
    );
  } else {
    reasons.push(`無手術紀錄，無手術一次金給付`);
  }

  return {
    eligible: total > 0,
    totalPayout: total,
    breakdown: reasons,
  };
}
