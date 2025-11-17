import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const AGENT_BASE = process.env.AGENT_URL || "http://localhost:8131"; // Patient agent port
console.log(`[acapy] using agent base: ${AGENT_BASE}`);


/** 測試 Agent 連線狀態 */
export async function ping() {
  return axios.get(`${AGENT_BASE}/status`);
}

/** 取得所有連線 */
export async function getConnections() {
  try {
    const res = await axios.get(`${AGENT_BASE}/connections`);
    return res.data.results;
  } catch (e) {
    console.error("get connections error:", e.message);
    throw e;
  }
}

/**  DID Exchange：建立 Invitation（給前端用來產 QRCode） */
export async function createInvitation(options = {}) {
  try {
    const res = await axios.post(
      `${AGENT_BASE}/connections/create-invitation`,
      {
        auto_accept: true, // 需要的話可以改成 false
        ...options,
      }
    );

    return res.data;
  } catch (err) {
    console.error(
      "ACA-Py /create-invitation error:",
      err.response?.status,
      err.response?.data || err.message
    );
    throw new Error(err.response?.data?.error || err.message);
  }
}

/** 接收邀請 */
export async function receiveInvitation(invite) {
  const res = await axios.post(`${AGENT_BASE}/connections/receive-invitation`, invite, 
    {
      headers: { "Content-Type": "application/json" },
    } );
  return res.data;
}


/** 取得 Credentials */
export async function getCredentials() {
  const res = await axios.get(`${AGENT_BASE}/credentials`);
  return res.data.results;
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

/** Remove connection */
export async function removeConnection(id) {
  return axios.post(`${AGENT_BASE}/connections/${id}/remove`);
}
