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
  try {
    const res = await axios.get(`${AGENT_BASE}/credentials`);
    // ACA-Py 1.2 的格式通常是 { results: [ { referent, attrs, schema_id, cred_def_id, ... } ] }
    return res.data.results || res.data;
  } catch (err) {
    console.error(
      "ACA-Py GET /credentials error:",
      err.response?.status,
      err.response?.data || err.message
    );
    throw err;
  }
}

/** 刪除一張已存進 wallet 的 credential */
// acapy.js

/** 刪除一張已儲存的 Credential */
export async function removeCredential(credentialId) {
  if (!credentialId) {
    throw new Error("credentialId is required");
  }

  try {
    const res = await axios.delete(`${AGENT_BASE}/credential/${credentialId}`);
    // 1.2 LTS：刪除成功通常回 200 + 空 body 或簡單 json
    return res.data;
  } catch (err) {
    console.error(
      "[PS] ACA-Py DELETE /credential/{id} error:",
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

/** 拒絕 Credential Offer → 送 problem-report + 刪掉 record */
export async function rejectCredentialOffer(
  credExId,
  reason = "User rejected credential offer"
) {
  try {
    // 1) 送 problem-report（注意：一定要叫 description）
    await axios.post(
      `${AGENT_BASE}/issue-credential/records/${credExId}/problem-report`,
      { description: reason },
      { headers: { "Content-Type": "application/json" } }
    );

    // 2) 可選：順手把這筆 exchange record 刪掉
    await axios.delete(
      `${AGENT_BASE}/issue-credential/records/${credExId}`
    );

    return { ok: true };
  } catch (err) {
    console.error(
      "[PS] ACA-Py reject credential offer error:",
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

// 取得單一 issue-credential record（用在 Accept / Debug 等）
export async function getCredentialRecord(credExId) {
  if (!credExId) {
    throw new Error("credExId is required");
  }

  try {
    const res = await axios.get(
      `${AGENT_BASE}/issue-credential/records/${credExId}`
    );
    // ACA-Py 1.2: 回傳是一整個 record 物件
    return res.data;
  } catch (err) {
    console.error(
      "[PS] ACA-Py GET /issue-credential/records/{id} error:",
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

// 取得此 proof_exchange 可以用的 credentials（裡面有整張 VC 的 attrs）
export async function getProofCredentials(proofExId) {
  try {
    const res = await axios.get(
      `${AGENT_BASE}/present-proof/records/${proofExId}/credentials`
    );
    // ACA-Py 會回傳陣列，每一個 element 形如：
    // { cred_info: { referent, attrs: {...} }, presentation_referents: [...] }
    return res.data;
  } catch (e) {
    console.error(
      "[PS] ACA-Py GET /present-proof/records/{id}/credentials error:",
      e.response?.status,
      e.response?.data || e.message
    );
    const detail =
      typeof e.response?.data === "string"
        ? e.response.data
        : JSON.stringify(e.response?.data || { error: e.message });
    throw new Error(detail);
  }
}

/** 接受某一筆 offer：只送 request，不在這裡 store */
/** 按下 Accept 時，對 ACA-Py 下 send-request（做法 B 第一步） */
export async function acceptCredentialOffer(credExId) {
  try {
    const res = await axios.post(
      `${AGENT_BASE}/issue-credential/records/${credExId}/send-request`,
      {}
    );
    return res.data;
  } catch (err) {
    console.error(
       "[PS] ACA-Py accept credential offer error:",
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

// 取得單一 proof record
export async function getProofRecord(proofExId) {
  if (!proofExId) throw new Error("proofExId is required");

  try {
    const res = await axios.get(
      `${AGENT_BASE}/present-proof/records/${proofExId}`
    );
    return res.data;
  } catch (err) {
    console.error(
      "[PS] ACA-Py GET /present-proof/records/{id} error:",
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


export async function acceptRequest(connectionId) {
  const res = await axios.post(
    `${AGENT_BASE}/didexchange/${connectionId}/accept-request`
  );
  return res.data;
}

// 1. Holder 端列出所有「收到的 Proof Requests」
export async function getProofs() {
  try {
    const res = await axios.get(`${AGENT_BASE}/present-proof/records`, {
      params: {
        role: "prover",            // 我是證明者 (holder)
        state: "request_received", // 剛收到 request 還沒回應
      },
    });

    return res.data.results || [];
  } catch (e) {
    console.error(
      "getProofs error:",
      e.response?.status,
      e.response?.data || e.message
    );
    throw e;
  }
}

// 自動替這個 proof_ex_id 找錢包裡可用的 credential，然後送 presentation
// revealAttrNames: 可選，陣列，例如 ["encounter_class", "admission_date", ...]
// 不傳或傳 null → 預設全部欄位 revealed: true
export async function sendProofPresentation(proofExId, selectedReferents) {
  try {
    // 1) 先拿 proof record，看它要哪些欄位
    const recRes = await axios.get(
      `${AGENT_BASE}/present-proof/records/${proofExId}`
    );
    const rec = recRes.data;

    const proofReq =
      rec.presentation_request?.proof_request ||
      rec.presentation_request ||
      rec.proof_request ||
      null;

    if (!proofReq || !proofReq.requested_attributes) {
      throw new Error("No requested_attributes found in proof request.");
    }

    const allReferents = Object.keys(proofReq.requested_attributes);

    // 如果前端有傳 selectedReferents，就只送那些；沒傳就全部送
    let targetReferents = allReferents;
    if (Array.isArray(selectedReferents) && selectedReferents.length > 0) {
      targetReferents = allReferents.filter((r) =>
        selectedReferents.includes(r)
      );
      if (!targetReferents.length) {
        throw new Error(
          "Selected attributes do not match any requested referents."
        );
      }
    }

    // 2) 拿這個 proof_ex_id 下，可用的 credentials
    const credsRes = await axios.get(
      `${AGENT_BASE}/present-proof/records/${proofExId}/credentials`
    );
    const allCreds = credsRes.data || [];

    if (!allCreds.length) {
      throw new Error(
        "No matching credentials found in wallet for this proof request."
      );
    }

    const requestedAttributesBody = {};

    // 3) 對每一個要送出的 referent，挑一張 credential
    for (const referent of targetReferents) {
      const match = allCreds.find((c) =>
        (c.presentation_referents || []).includes(referent)
      );

      if (!match) {
        throw new Error(
          `No matching credential found in wallet for referent: ${referent}`
        );
      }

      const credInfo = match.cred_info || match;
      const credId = credInfo.referent;

      requestedAttributesBody[referent] = {
        cred_id: credId,
        revealed: true,
      };
    }

    // 4) 組 payload
    const body = {
      self_attested_attributes: {},
      requested_attributes: requestedAttributesBody,
      requested_predicates: {},
    };

    const res = await axios.post(
      `${AGENT_BASE}/present-proof/records/${proofExId}/send-presentation`,
      body,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    return res.data;
  } catch (e) {
    console.error(
      "[PS] sendProofPresentation error:",
      e.response?.status,
      e.response?.data || e.message
    );

    const detail =
      typeof e.response?.data === "string"
        ? e.response.data
        : JSON.stringify(e.response?.data || { error: e.message });

    throw new Error(detail);
  }
}



// 3. 按下 Decline 時，回一個 problem-report
export async function declineProofRequest(proofExId, description = "User declined proof request") {
  try {
    const res = await axios.post(
      `${AGENT_BASE}/present-proof/records/${proofExId}/problem-report`,
      { description }
    );
    return res.data;
  } catch (e) {
    console.error(
      "declineProofRequest error:",
      e.response?.status,
      e.response?.data || e.message
    );
    throw e;
  }
}

