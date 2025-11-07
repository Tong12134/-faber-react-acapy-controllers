// server/src/acapy.js
import axios from "axios";

const AGENT_BASE = process.env.AGENT_URL || "http://localhost:8031";

/** 測試連線 */
export async function ping() {
  return axios.get(`${AGENT_BASE}/status`);
}

/** 取得 Credential Definitions */
export async function getCredentialDefinitions() {
  const res = await axios.get(`${AGENT_BASE}/credential-definitions/created`);
  return res.data.credential_definition_ids;
}

/** 取得 Schemas */
export async function getSchemas() {
  const res = await axios.get(`${AGENT_BASE}/schemas/created`);
  return res.data.schema_ids;
}

/** 取得 Connections */
export async function getConnections() {
  const res = await axios.get(`${AGENT_BASE}/connections`);
  return res.data.results;
}

/** 發送 Credential */
export async function sendCredential(credentialJson) {
  const res = await axios.post(`${AGENT_BASE}/issue-credential/send`, credentialJson);
  return res.data;
}
