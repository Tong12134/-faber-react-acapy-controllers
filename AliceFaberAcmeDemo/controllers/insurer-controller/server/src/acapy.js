// server/src/acapy.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();


const AGENT_BASE =
  process.env.AGENT_ADMIN_URL || // 建議你改用這個環境變數
  process.env.AGENT_URL ||       // 兼容你原本的設定
  "http://localhost:8141";       // 預設指向 admin port

console.log(`[acapy] using agent base: ${AGENT_BASE}`);

/** Agent Status */
export async function ping() {
  return axios.get(`${AGENT_BASE}/status`);
}

/** Get all connections */
export async function getConnections() {
  const res = await axios.get(`${AGENT_BASE}/connections`);
  return res.data.results || [];
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

    // ACA-Py 回傳格式：
    // {
    //   "connection_id": "...",
    //   "invitation": { ... },
    //   "invitation_url": "didcomm://..."
    // }

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

/**
 * （保留，但目前 Mode A 不會用到）
 * Indy Static Connection：需要 theirSeed 或 theirDid+theirVerkey
 */
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
    const res = await axios.post(`${AGENT_BASE}/connections/create-static`, body);
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
  const res = await axios.post(
    `${AGENT_BASE}/connections/receive-invitation`,
    invite,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  return res.data;
}

/** Remove connection */
export async function removeConnection(id) {
  return axios.post(`${AGENT_BASE}/connections/${id}/remove`);
}
