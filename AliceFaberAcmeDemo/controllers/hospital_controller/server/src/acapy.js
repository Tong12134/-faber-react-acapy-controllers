// server/src/acapy.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Faber Admin API：在這個 demo 裡是 8121 / 本地Agent 8021
const AGENT_HOST = process.env.FABER_AGENT_HOST || "localhost";
const AGENT_ADMIN_PORT = process.env.AGENT_ADMIN_PORT || "8021";

const AGENT_BASE =
  process.env.AGENT_URL || `http://${AGENT_HOST}:${AGENT_ADMIN_PORT}`;

console.log("[acapy] using agent base:", AGENT_BASE);

/** 測試連線 */
export async function ping() {
  const res = await axios.get(`${AGENT_BASE}/status`);
  return res.data;
}


/** 確保 Hospital 專用的 Schema 與 Cred Def 已建立 */
export async function ensureHospitalSchemaAndCredDef() {
  const SCHEMA_NAME = "HospitalEncounterSummaryV1";
  const SCHEMA_VERSION = "1.0.1";
  
  const ATTRIBUTES = [
    "patient_id", 
    "patient_name", 
    "patient_birthdate_dateint", 
    "encounter_id",
    "encounter_date",
    "encounter_class",
    "encounter_department",
    "diagnosis_system",
    "diagnosis_code",
    "diagnosis_display",
    "admission_date", //住院開始日期
    "discharge_date", //住院結束日期
    // "length_of_stay_days",
    "procedure_code",
    "procedure_display",
    "provider_org_name",
    "provider_org_id",
    "fhir_bundle_id",
    "fhir_bundle_hash",
    "record_type",
    "timestamp",
  ];
  const TAG = "hospital-encounter-v1"; 
  

  // 1) 先找 schema
  const createdSchemas = await axios.get(`${AGENT_BASE}/schemas/created`);
  let schemaId = (createdSchemas.data.schema_ids || []).find((id) =>
    id.includes(`:${SCHEMA_NAME}:${SCHEMA_VERSION}`)
  );

  if (!schemaId) {
    const res = await axios.post(
      `${AGENT_BASE}/schemas`,
      {
        schema_name: SCHEMA_NAME,
        schema_version: SCHEMA_VERSION,
        attributes: ATTRIBUTES,
      },
      { headers: { "Content-Type": "application/json" } }
    );
    schemaId = res.data.schema_id;
    console.log("[HS] [INIT] created schema:", schemaId);
  } else {
    console.log("[HS] [INIT] schema already exists:", schemaId);
  }

  // 2) 找 cred def
  try {
    const createdDefs = await axios.get(
      `${AGENT_BASE}/credential-definitions/created`
    );
    let credDefId = (createdDefs.data.credential_definition_ids || []).find(
      (id) => id.endsWith(`:${TAG}`)
    );

    if (!credDefId) {
      const res = await axios.post(
        `${AGENT_BASE}/credential-definitions`,
        {
          schema_id: schemaId,
          tag: TAG,
          support_revocation: false,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      credDefId = res.data.credential_definition_id;
      console.log("[HS] [INIT] created cred def:", credDefId);
    } else {
      console.log("[HS] [INIT] cred def already exists:", credDefId);
    }

    return { schemaId, credDefId };
  } catch (err) {
    //  印出完整的 response data
    console.error("================ ERROR DEBUG ================");
    console.error("[HS] Status:", err.response?.status);
    console.error("[HS] Data:", JSON.stringify(err.response?.data, null, 2));
    console.error("[HS] Message:", err.message);
    console.error("=============================================");

    // 把 ACA-Py 回傳內容包進錯誤字串往外丟，server 那邊就看得到細節
    const detail =
      typeof err.response?.data === "string"
        ? err.response.data
        : JSON.stringify(err.response?.data || { error: err.message });

    throw new Error(detail);
  }
}

/** 取得所有 Schemas */
export async function getSchemas() {
  try {
    const res = await axios.get(`${AGENT_BASE}/schemas/created`);
    return res.data.schema_ids;
  } catch (e) {
    console.error("get schemas error:", e.message);
    throw e;
  }
}

/** 取得單一 Schema */
export async function getSchema(schemaId) {
  const res = await axios.get(`${AGENT_BASE}/schemas/${schemaId}`);
  return res.data;
}


/** 建立 Schema */
export async function createSchema({ name, version, attributes }) {
  if (!name || !version || !Array.isArray(attributes) || attributes.length === 0) {
    throw new Error("createSchema 需要 name、version 與至少一個 attributes");
  }

  try {
    const res = await axios.post(`${AGENT_BASE}/schemas`, {
      schema_name: name,
      schema_version: version,
      attributes,
    });
    return res.data; // 內含 schema_id
  } catch (err) {
    console.error(
      "ACA-Py /schemas error:",
      err.response?.status,
      err.response?.data || err.message
    );
    throw new Error(err.response?.data?.error || err.message);
  }
}


/** 取得所有 Connections */
export async function getConnections() {
  try {
    const res = await axios.get(`${AGENT_BASE}/connections`);
    return res.data.results || [];
  } catch (e) {
    console.error(
      "get connections error:",
      e.response?.status,
      e.response?.data || e.message
    );
    throw e;
  }
}

/** 取得單一連線 */
export async function getConnection(connectionId) {
  const res = await axios.get(`${AGENT_BASE}/connections/${connectionId}`);
  return res.data;
}

/** 建立 Static Connection（給後端系統對系統用） */
export async function createStaticConnection({
  theirSeed,
  theirDid,
  theirVerkey,
  theirLabel = "Patient Agent",
} = {}) {
  const body = { their_label: theirLabel };

  if (theirSeed) {
    body.their_seed = theirSeed;
  } else if (theirDid && theirVerkey) {
    body.their_did = theirDid;
    body.their_verkey = theirVerkey;
  } else {
    throw new Error(
      "createStaticConnection 需要 either theirSeed 或 (theirDid + theirVerkey)"
    );
  }

  try {
    const res = await axios.post(
      `${AGENT_BASE}/connections/create-static`,
      body
    );
    return res.data;
  } catch (err) {
    console.error(
      "ACA-Py /create-static error:",
      err.response?.status,
      err.response?.data || err.message
    );
    throw new Error(err.response?.data?.error || err.message);
  }
}

/**
 * 建立 Invitation（給前端用來產 QRCode）
 */
export async function createInvitation(options = {}) {
  try {
    const body = {
      auto_accept: true,
      // 使用 DIDExchange 1.1 handshakes
      handshake_protocols: ["https://didcomm.org/didexchange/1.1"],
      // 如果之後要支援多用 / 附加 attachment，可以從 options 傳進來
      ...options,
    };

    const res = await axios.post(
      `${AGENT_BASE}/out-of-band/create-invitation`,
      body,
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    // 回傳格式通常是：
    // {
    //   "invitation": { ... },
    //   "invitation_url": "https://..."
    //   "trace": false,
    //   "out_of_band_id": "..."
    // }
    return res.data;
  } catch (err) {
    console.error(
      "ACA-Py /out-of-band/create-invitation error:",
      err.response?.status,
      err.response?.data || err.message
    );
    throw new Error(err.response?.data?.error || err.message);
  }
}

/** Receive invitation（另一端收到 invitation 時使用） */
export async function receiveInvitation(invite) {
  try {
    const res = await axios.post(
      `${AGENT_BASE}/out-of-band/receive-invitation`,
      invite,
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return res.data;
  } catch (err) {
    console.error(
      "ACA-Py /out-of-band/receive-invitation error:",
      err.response?.status,
      err.response?.data || err.message
    );
    throw new Error(err.response?.data?.error || err.message);
  }
}

/** 接受特定邀請 */
export async function acceptInvitation(connectionId) {
  const res = await axios.post(
    `${AGENT_BASE}/connections/${connectionId}/accept-invitation`
  );
  return res.data;
}

/** 發送 Credential */
/** 發送 Credential（Issue V1） */
export async function sendCredential(credentialJson) {
  try {
    const res = await axios.post(
      `${AGENT_BASE}/issue-credential/send`,
      credentialJson
    );
    return res.data;
  } catch (err) {
    console.error(
      "ACA-Py /issue-credential/send error:",
      err.response?.status,
      err.response?.data || err.message
    );

    const detail =
      typeof err.response?.data === "string"
        ? err.response.data
        : JSON.stringify(err.response?.data || { error: err.message });

    // 丟回更有資訊的錯誤字串，前端就不會只看到「Request failed with status code 400」
    throw new Error(detail);
  }
}


/** 取得所有 Credential Definitions */
export async function getCredentialDefinitions() {
  const res = await axios.get(
    `${AGENT_BASE}/credential-definitions/created`
  );
  return res.data.credential_definition_ids;
}

/** 取得單一 Credential Definition 詳細資料 */
export async function getCredentialDefinition(defId) {
  const res = await axios.get(
    `${AGENT_BASE}/credential-definitions/${defId}`
  );
  return res.data;
}

/** 建立 Credential Definition */
export async function createCredentialDefinition({
  schemaId,
  tag = "default",
  supportRevocation = false,
}) {
  if (!schemaId) {
    throw new Error("createCredentialDefinition 需要 schemaId");
  }

  try {
    const res = await axios.post(`${AGENT_BASE}/credential-definitions`, {
      schema_id: schemaId,
      tag,
      support_revocation: supportRevocation,
    });
    return res.data; // 內含 credential_definition_id
    } catch (err) {
    console.error(
      "ACA-Py /credential-definitions error:",
      err.response?.status,
      err.response?.data || err.message
    );

    // 把 ACA-Py 回傳的 body 變成字串丟回去，方便前端 / curl 看
    const detail =
      typeof err.response?.data === "string"
        ? err.response.data
        : JSON.stringify(err.response?.data || { error: err.message });

    throw new Error(detail);
  }
}

/** Remove connection */
export async function removeConnection(id) {
  try {
    const res = await axios.delete(`${AGENT_BASE}/connections/${id}`);
    return res.data;
  } catch (err) {
    console.error(
      "ACA-Py /connections/{id} DELETE error:",
      err.response?.status,
      err.response?.data || err.message
    );
    throw new Error(err.response?.data?.error || err.message);
  }
}

/** DIDExchange：邀請方接受 request */
export async function acceptRequest(connectionId) {
  try {
    const res = await axios.post(
      `${AGENT_BASE}/didexchange/${connectionId}/accept-request`
    );
    return res.data;
  } catch (err) {
    console.error(
      "ACA-Py accept-request error:",
      err.response?.status,
      err.response?.data || err.message
    );
    throw new Error(err.response?.data?.error || err.message);
  }
}
