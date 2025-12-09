import { useState } from "react";

export default function AcceptConnectionForm({ onAccepted }) {
  const [inviteJson, setInviteJson] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // 從 invitation URL 中解析出 JSON（支援 ?oob=... 或 ?c_i=...）
  const extractJsonFromUrl = (urlString) => {
    try {
      const url = new URL(urlString.trim());

      // 先找新版 OOB 的 oob，找不到再找舊版 connections 的 c_i
      const encoded = url.searchParams.get("oob") || url.searchParams.get("c_i");
      if (!encoded) return null;

      // base64url → base64
      let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4 !== 0) {
        b64 += "=";
      }
      const jsonStr = atob(b64);
      return jsonStr;
    } catch (e) {
      return null;
    }
  };

  const handleAccept = async () => {
    let payload = inviteJson.trim();

    // 如果上面沒貼 JSON，但下面有貼 URL，就先解析 URL
    if (!payload && inviteUrl.trim()) {
      const decoded = extractJsonFromUrl(inviteUrl);
      if (!decoded) {
        alert("無法從邀請 URL 解析 invitation JSON，請確認格式或直接貼上 JSON。");
        return;
      }
      payload = decoded;
      setInviteJson(decoded); // 同步顯示在上面的 textarea
    }

    if (!payload) {
      alert("請先貼上 invitation JSON 或 URL");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/connections/receive-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      const data = await res.json();
      if (data.ok) {
        const conn =
          data.data ||
          data.connection ||
          data.record ||
          null;
        const connId =
          conn?.connection_id ||
          conn?.connection?.connection_id ||
          null;

        onAccepted && onAccepted(connId);

        //  成功的情況：不把 loading 設回 false，讓按鈕一直維持 Accepting...
        // 反正通常 onAccepted 會跳轉頁面，這個 component 會被 unmount
        return;
      } else {
        alert("❌ Error: " + data.error);
      }
    } catch (err) {
      alert("Invalid JSON or network error: " + err.message);
    }

    // 只有「失敗」才會走到這裡，把 loading 設回 false
    setLoading(false);

  };

  return (
    <div style={{ marginBottom: 25 }}>
      {/* Paste invitation object block */}
      <div style={{ marginBottom: "15px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "10px",
            marginTop: "15px",
            fontSize: "17px",
            color: "#374151",
          }}
        >
          Paste invitation object block:
        </label>
        <textarea
          rows={8}
          value={inviteJson}
          onChange={(e) => setInviteJson(e.target.value)}
          placeholder='例如：{"@type": "...", "serviceEndpoint": "..."}'
          style={{
            width: "100%",
            borderRadius: "8px",
            border: "1px solid #ccd9ff",
            padding: "12px",
            fontSize: "15px",
            fontFamily: "monospace",
            backgroundColor: "#f9faff",
            resize: "none",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Alternatively paste an invitation URL */}
      <div style={{ marginBottom: "15px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "10px",
            marginTop: "15px",
            fontSize: "17px",
            color: "#374151",
          }}
        >
          Alternatively paste an invitation URL:
        </label>
        <input
          type="text"
          value={inviteUrl}
          onChange={(e) => setInviteUrl(e.target.value)}
          placeholder="例如：http://insurer-agent:8040?oob=eyJAdHlwZ... 或 ?c_i=eyJAdHlwZ..."
          style={{
            width: "100%",
            borderRadius: "8px",
            border: "1px solid #ccd9ff",
            padding: "10px 12px",
            fontSize: "15px",
            fontFamily: "monospace",
            backgroundColor: "#ffffff",
            boxSizing: "border-box",
          }}
        />
      </div>

        <button
          onClick={handleAccept}
          disabled={loading}
          style={{
            marginTop: "16px",
            width: "100%",
            backgroundColor: "#2d6a4f",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "12px 20px",
            fontSize: "17px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 500,
            boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
            transition: "all 0.2s ease",
            opacity: loading ? 0.7 : 1,          // ← 新增：Accepting 時變淡
          }}
          onMouseOver={(e) => {
            if (!loading) e.target.style.backgroundColor = "#40916c"; // ← loading 中就不變色
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = "#2d6a4f";
          }}
        >
          {loading ? "Accepting..." : "Accept"}
      </button>

    </div>
  );
}

