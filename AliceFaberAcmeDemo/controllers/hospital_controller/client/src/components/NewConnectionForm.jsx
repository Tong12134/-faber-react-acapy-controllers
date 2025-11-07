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
      <h4>New Connection</h4>
      <button
        className="btn btn-primary"
        onClick={handleCreate}
        disabled={creating}
      >
        {creating ? "Creating..." : "Create Invitation"}
      </button>

      {inviteUrl && (
        <div style={{ marginTop: 10 }}>
          <p>Invitation URL:</p>
          <textarea
            className="form-control"
            rows="3"
            readOnly
            value={inviteUrl}
          />
        </div>
      )}
    </div>
  );
}
