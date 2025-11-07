// client/src/components/AcceptConnectionForm.jsx
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
      <h4>Accept Invitation</h4>
      <textarea
        className="form-control"
        rows="4"
        value={inviteJson}
        onChange={(e) => setInviteJson(e.target.value)}
        placeholder="Paste invitation JSON here"
      />
      <button className="btn btn-success mt-2" onClick={handleAccept}>
        Accept
      </button>
    </div>
  );
}
