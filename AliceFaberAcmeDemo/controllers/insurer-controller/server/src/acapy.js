// server/src/acapy.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const AGENT_HOST = process.env.FABER_AGENT_HOST || "localhost";
const AGENT_ADMIN_PORT = process.env.AGENT_ADMIN_PORT || "8141";

const AGENT_BASE =
  process.env.AGENT_URL || `http://${AGENT_HOST}:${AGENT_ADMIN_PORT}`;

console.log("[acapy] using agent base:", AGENT_BASE);

/** 測試連線 */
export async function ping() {
  const res = await axios.get(`${AGENT_BASE}/status`);
  return res.data;
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

export async function acceptRequest(connectionId) {
  const res = await axios.post(
    `${AGENT_BASE}/didexchange/${connectionId}/accept-request`
  );
  return res.data;
}

// 取得 present-proof v2 記錄列表
// Insurer 端：列出所有 verifier 角色的 proof records
export async function getProofs() {
  try {
    const res = await axios.get(`${AGENT_BASE}/present-proof/records`, {
      params: {
        role: "verifier",  
        // 先不要過濾 state，全部拿回來，前端再決定怎麼顯示
        // 例如要只看已驗證的，可以再加 state: "verified"
      },
    });

    return res.data.results || [];
  } catch (e) {
    console.error(
      "[IS] getProofs error:",
      e.response?.status,
      e.response?.data || e.message
    );
    throw e;
  }
}

// 發送 proof request（present-proof v1）
export async function sendProofRequest(proofRequestJson) {
  try {
    const res = await axios.post(
      `${AGENT_BASE}/present-proof/send-request`,
      proofRequestJson,
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return res.data;
  } catch (err) {
    console.error(
      "ACA-Py /present-proof/send-request error:",
      err.response?.status,
      err.response?.data || err.message
    );

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

// 刪除一筆 present-proof record（只刪 controller 這邊的紀錄）
export async function deleteProofRecord(proofExId) {
  try {
    const res = await axios.delete(
      `${AGENT_BASE}/present-proof/records/${proofExId}`
    );
    return res.data;
  } catch (e) {
    console.error(
      "[IS] deleteProofRecord error:",
      e.response?.status,
      e.response?.data || e.message
    );
    throw e;
  }
}


