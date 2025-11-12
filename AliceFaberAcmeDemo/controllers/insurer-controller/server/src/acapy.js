import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const AGENT_BASE = process.env.AGENT_URL || "http://localhost:8041"; // Patient agent port
console.log(`[acapy] using agent base: ${AGENT_BASE}`);


/** 測試 Agent 狀態 */
export async function ping() {
  return axios.get(`${AGENT_BASE}/status`);
}

/** 取得所有連線 */
export async function getConnections() {
  const res = await axios.get(`${AGENT_BASE}/connections`);
  return res.data.results;
}

/** 接收邀請 */
export async function receiveInvitation(invite) {
  const res = await axios.post(`${AGENT_BASE}/connections/receive-invitation`, invite);
  return res.data;
}

/** Proofs（驗證資料） */
export async function getProofs() {
  const res = await axios.get(`${AGENT_BASE}/present-proof/records`);
  return res.data.results;
}

/** 發送 Proof Request（請求驗證） */
export async function sendProofRequest(payload) {
  const res = await axios.post(`${AGENT_BASE}/present-proof/send-request`, payload);
  return res.data;
}
