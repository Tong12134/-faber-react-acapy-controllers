import { useState } from "react";

export default function AcceptConnectionForm({ onAccepted }) {
  const [inviteJson, setInviteJson] = useState("");

  const handleAccept = async () => {
    try {
      const res = await fetch("/api/connections/receive-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: inviteJson,
      });
      const data = await res.json();
      if (data.ok) {
        alert("✅ Invitation accepted");
        onAccepted && onAccepted();
      } else {
        alert("❌ Error: " + data.error);
      }
    } catch (err) {
      alert("Invalid JSON or network error: " + err.message);
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>

      {/* 輸入框（加大） */}
      <textarea
        className="form-control"
        rows="8" // 改這裡讓框變大
        value={inviteJson}
        onChange={(e) => setInviteJson(e.target.value)}
        placeholder="Paste invitation JSON here"
        style={{
          borderRadius: "6px",
          border: "1px solid #ccd9ff",
          padding: "10px",
          backgroundColor: "#f9faff",
          fontFamily: "monospace",
          fontSize: "15px",
          width: "100%",
          marginBottom: "12px",
        }}
      />

      {/* ✅ 按鈕（保持原樣但稍微放大） */}
      <button
        className="btn btn-success mt-2"
        onClick={handleAccept}
        style={{
          fontSize: "18px",
          padding: "10px 20px",
          fontWeight: 500,
        }}
      >
        Accept
      </button>
    </div>
  );
}
