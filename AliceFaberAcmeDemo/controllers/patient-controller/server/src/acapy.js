// server/src/acapy.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const AGENT_BASE = process.env.AGENT_URL || "http://localhost:8131";
console.log("[acapy] using agent base:", AGENT_BASE);

/** 測試連線 */
export async function ping() {
  const res = await axios.get(`${AGENT_BASE}/status`);
  return res.data;
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

/** 發送 Credential */
export async function sendCredential(credentialJson) {
  const res = await axios.post(
    `${AGENT_BASE}/issue-credential/send`,
    credentialJson,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  return res.data;
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
    `${AGENT_BASE}/credential-definitions/${encodeURIComponent(defId)}`
  );
  return res.data;
}


/** 取得「已存進錢包」的 credentials → My Credentials 用 */
export async function getCredentials() {
  const res = await axios.get(`${AGENT_BASE}/credentials`);
  return res.data.results || [];
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

// 取得 issue-credential records（給 Patient 看「還沒接受的邀請」）
export async function getCredentialRecords() {
  try {
    const res = await axios.get(`${AGENT_BASE}/issue-credential/records`);
    return res.data.results || [];
  } catch (e) {
    console.error(
      "getCredentialRecords error:",
      e.response?.status,
      e.response?.data || e.message
    );
    throw e;
  }
}

// Holder 接受一張 offer：送出 request
export async function sendCredentialRequest(credExId) {
  const res = await axios.post(
    `${AGENT_BASE}/issue-credential/records/${credExId}/send-request`,
    {}
  );
  return res.data;
}

/** 把某一筆 credential_exchange 實際存進 wallet */
// export async function storeCredential(credExId) {
//   try {
//     const res = await axios.post(
//       `${AGENT_BASE}/issue-credential/records/${credExId}/store`,
//       {}
//     );
//     return res.data;
//   } catch (err) {
//     console.error(
//       "ACA-Py storeCredential error:",
//       err.response?.status,
//       err.response?.data || err.message
//     );
//     throw new Error(
//       typeof err.response?.data === "string"
//         ? err.response.data
//         : JSON.stringify(err.response?.data || { error: err.message })
//     );
//   }
// }


// 取得 holder 端的 offer list
export async function getCredentialOffers() {
  try {
    const res = await axios.get(`${AGENT_BASE}/issue-credential/records`, {
      params: {
        role: "holder",
        state: "offer_received",
      },
    });
    return res.data.results || [];
  } catch (err) {
    console.error(
      "ACA-Py getCredentialOffers error:",
      err.response?.status,
      err.response?.data || err.message
    );
    throw new Error(err.response?.data?.error || err.message);
  }
}


/** 接受某一筆 offer：只送 request，不在這裡 store */
/** 按下 Accept 時，對 ACA-Py 下 send-request（做法 B 第一步） */
export async function acceptCredentialOffer(credExId) {
  try {
    const res = await axios.post(
      `${AGENT_BASE}/issue-credential/records/${credExId}/send-request`
    );
    return res.data;
  } catch (err) {
    console.error(
      "ACA-Py /send-request error:",
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

