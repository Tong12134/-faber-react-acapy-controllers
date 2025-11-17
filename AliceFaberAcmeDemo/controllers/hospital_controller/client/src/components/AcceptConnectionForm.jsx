import { useState } from "react";

export default function AcceptConnectionForm({ onAccepted }) {
  const [inviteJson, setInviteJson] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // 從 invitation URL 中解析出 JSON（支援 ?c_i=...）
  const extractJsonFromUrl = (urlString) => {
    try {
      const url = new URL(urlString.trim());
      const c_i = url.searchParams.get("c_i");
      if (!c_i) return null;

      // base64url → base64
      let b64 = c_i.replace(/-/g, "+").replace(/_/g, "/");
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
      setInviteJson(decoded); // 也同步顯示在上面的 textarea
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
        body: payload, // 和你原本一樣：直接把 JSON 字串送出去
      });
      const data = await res.json();
      if (data.ok) {
        alert("✅ Invitation accepted successfully");
        onAccepted && onAccepted();
        setInviteJson("");
        setInviteUrl("");
      } else {
        alert("❌ Error: " + data.error);
      }
    } catch (err) {
      alert("Invalid JSON or network error: " + err.message);
    } finally {
      setLoading(false);
    }
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
          placeholder="例如：http://insurer-agent:8040?c_i=eyJAdHlwZ..."
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
        }}
        onMouseOver={(e) => {
          if (!loading) e.target.style.backgroundColor = "#40916c";
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
