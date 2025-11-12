import { useState } from "react";

export default function NewConnectionForm({ onCreated }) {
  const [inviteUrl, setInviteUrl] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/connections/create-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.ok) {
        setInviteUrl(data.invitation_url);
        onCreated && onCreated();
      } else {
        alert("❌ Failed to create invitation: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setCreating(false);
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
         Create Invitation
      </h3>

      <button
        onClick={handleCreate}
        disabled={creating}
        style={{
          backgroundColor: "#1e3a5f",
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
        onMouseOver={(e) => (e.target.style.backgroundColor = "#2c5282")}
        onMouseOut={(e) => (e.target.style.backgroundColor = "#1e3a5f")}
      >
        {creating ? "Creating..." : "Create Invitation"}
      </button>

      {inviteUrl && (
        <div
          style={{
            marginTop: "20px",
            backgroundColor: "#f8faff",
            border: "1px solid #ccd9ff",
            borderRadius: "8px",
            padding: "12px",
          }}
        >
          <label style={{ color: "#003366", fontWeight: 500 }}>
            Invitation URL:
          </label>
          <textarea
            readOnly
            rows="3"
            value={inviteUrl}
            style={{
              width: "100%",
              marginTop: "8px",
              borderRadius: "6px",
              border: "1px solid #ccd9ff",
              padding: "10px",
              fontSize: "14px",
              fontFamily: "monospace",
              backgroundColor: "#fff",
              resize: "none",
            }}
          />
        </div>
      )}
    </div>
  );
}
