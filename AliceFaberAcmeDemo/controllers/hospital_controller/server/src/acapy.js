// server/src/acapy.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const AGENT_BASE = process.env.AGENT_URL || "http://localhost:8021";
console.log("[acapy] using agent base:", AGENT_BASE);




/** 測試連線 */
export async function ping() {
  return axios.get(`${AGENT_BASE}/status`);
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


/** 取得所有 Connections */
export async function getConnections() {
  try {
    const res = await axios.get(`${AGENT_BASE}/connections`);
    return res.data.results;
  } catch (e) {
    console.error("get connections error:", e.message);
    throw e;
  }
}

/** 建立新的邀請 */
export async function createInvitation() {
  const res = await axios.post(`${AGENT_BASE}/connections/create-invitation`, {});
  return res.data;
}

/** 接受邀請連線 */
export async function receiveInvitation(invitationJson) {
  const res = await axios.post(`${AGENT_BASE}/connections/receive-invitation`, invitationJson);
  return res.data;
}

/** 取得單一連線 */
export async function getConnection(connectionId) {
  const res = await axios.get(`${AGENT_BASE}/connections/${connectionId}`);
  return res.data;
}

/** 接受特定邀請 */
export async function acceptInvitation(connectionId) {
  const res = await axios.post(`${AGENT_BASE}/connections/${connectionId}/accept-invitation`);
  return res.data;
}

/** 發送 Credential */
export async function sendCredential(credentialJson) {
  const res = await axios.post(`${AGENT_BASE}/issue-credential/send`, credentialJson);
  return res.data;
}

/** 取得所有 Credential Definitions */
export async function getCredentialDefinitions() {
  const res = await axios.get(`${AGENT_BASE}/credential-definitions/created`);
  return res.data.credential_definition_ids;
}

/** 取得單一 Credential Definition 詳細資料 */
export async function getCredentialDefinition(defId) {
  const res = await axios.get(`${AGENT_BASE}/credential-definitions/${defId}`);
  return res.data;
}


