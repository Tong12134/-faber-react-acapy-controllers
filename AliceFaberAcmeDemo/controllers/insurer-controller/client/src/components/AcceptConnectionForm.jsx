import { useState } from "react";

export default function AcceptConnectionForm({ onAccepted }) {
  const [inviteJson, setInviteJson] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/connections/receive-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: inviteJson,
      });
      const data = await res.json();
      if (data.ok) {
        alert("✅ Invitation accepted successfully");
        onAccepted && onAccepted();
        setInviteJson("");
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
    <div style={{ marginBottom: 20 }}>
      <h3
        style={{
          color: "#003366",
          fontWeight: 600,
          fontSize: "20px",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
         Accept Invitation
      </h3>

      <textarea
        rows="6"
        value={inviteJson}
        onChange={(e) => setInviteJson(e.target.value)}
        placeholder="Paste invitation JSON here"
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
        }}
      />

      <button
        onClick={handleAccept}
        disabled={loading}
        style={{
          marginTop: "12px",
          backgroundColor: "#2d6a4f",
          color: "white",
          border: "none",
          borderRadius: "8px",
          padding: "10px 20px",
          fontSize: "17px",
          cursor: "pointer",
          fontWeight: 500,
          boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
          transition: "all 0.2s ease",
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = "#40916c")}
        onMouseOut={(e) => (e.target.style.backgroundColor = "#2d6a4f")}
      >
        {loading ? "Accepting..." : "Accept"}
      </button>
    </div>
  );
}
