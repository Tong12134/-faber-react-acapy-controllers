import { useState, useEffect } from "react";

export default function ProofRequestsPage() {
  const [activeTab, setActiveTab] = useState("proofs");
  const [proofs, setProofs] = useState([]);
  const [connections, setConnections] = useState([]);
  const [credentialDefId, setCredentialDefId] = useState("");
  const [connectionId, setConnectionId] = useState("");
  const [proofRequestJson, setProofRequestJson] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // 🧩 抓取 Proof 紀錄
  const fetchProofs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proofs");
      const data = await res.json();
      if (data.ok) setProofs(data.results || []);
      else setMessage("❌ Failed to load proofs: " + data.error);
    } catch (err) {
      console.error(err);
      setMessage("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🧩 抓取 Connections
  const fetchConnections = async () => {
    try {
      const res = await fetch("/api/connections");
      const data = await res.json();
      if (data.ok) setConnections(data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProofs();
    fetchConnections();
  }, []);

  // 🧩 發送 Proof Request
  const sendProofRequest = async () => {
    try {
      if (!connectionId) {
        alert("⚠️ Please select a connection first.");
        return;
      }

      const defaultProofRequest = {
        connection_id: connectionId,
        proof_request: {
          name: "Proof of Insurance Eligibility",
          version: "1.0",
          requested_attributes: {
            "0_name_uuid": {
              name: "name",
              restrictions: [
                {
                  cred_def_id:
                    credentialDefId ||
                    "<Enter a valid Credential Definition ID>",
                },
              ],
            },
          },
          requested_predicates: {},
        },
      };

      const payload = proofRequestJson
        ? JSON.parse(proofRequestJson)
        : defaultProofRequest;

      const res = await fetch("/api/proofs/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.ok) {
        alert("✅ Proof request sent successfully!");
        fetchProofs();
      } else {
        alert("❌ Failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("❌ " + err.message);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#f8faff",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        minHeight: "70vh",
      }}
    >
      {/* ✅ 頁面標題 */}
      <h2
        style={{
          color: "#003366",
          borderBottom: "3px solid #cce0ff",
          paddingBottom: "8px",
          marginTop: "3px",
          marginBottom: "20px",
          fontWeight: 600,
          fontSize: "25px",
        }}
      >
        Proof Requests
      </h2>

      {/* ✅ Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #e0e8ff",
          marginBottom: "20px",
        }}
      >
        {["proofs", "request"].map((tab) => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              marginRight: "20px",
              paddingBottom: "8px",
              cursor: "pointer",
              borderBottom:
                activeTab === tab
                  ? "3px solid #003366"
                  : "3px solid transparent",
              fontWeight: activeTab === tab ? "600" : "400",
              color: activeTab === tab ? "#003366" : "#666",
              transition: "all 0.2s ease",
            }}
          >
            {tab === "proofs" ? "Proofs" : "Request Proof"}
          </div>
        ))}
      </div>

      {/* 🧾 Proofs 列表 */}
      {activeTab === "proofs" && (
        <div>
          {loading ? (
            <p>Loading proofs...</p>
          ) : proofs.length === 0 ? (
            <p>No proofs available.</p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {proofs.map((p) => (
                <div
                  key={p.presentation_exchange_id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "16px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <p>
                    <strong>ID:</strong> {p.presentation_exchange_id}
                  </p>
                  <p>
                    <strong>State:</strong>{" "}
                    <span
                      style={{
                        color:
                          p.state === "verified"
                            ? "green"
                            : p.state === "request-sent"
                            ? "#3366cc"
                            : "#666",
                      }}
                    >
                      {p.state}
                    </span>
                  </p>
                  <p>
                    <strong>Connection:</strong> {p.connection_id || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🧰 Request Proof 表單 */}
      {activeTab === "request" && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "10px",
            padding: "24px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h4 style={{ color: "#003366", marginBottom: "12px" }}>
            Request Proof
          </h4>

          {/* Connection */}
          <label style={{ fontWeight: 500, color: "#003366" }}>
            Select a Connection
          </label>
          <select
            value={connectionId}
            onChange={(e) => setConnectionId(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccd9ff",
              marginBottom: "12px",
            }}
          >
            <option value="">-- Select Connection --</option>
            {connections.map((c) => (
              <option key={c.connection_id} value={c.connection_id}>
                {c.their_label || c.connection_id}
              </option>
            ))}
          </select>

          {/* Credential Definition ID */}
          <label style={{ fontWeight: 500, color: "#003366" }}>
            Enter a Credential Definition ID:
          </label>
          <input
            type="text"
            value={credentialDefId}
            onChange={(e) => setCredentialDefId(e.target.value)}
            placeholder="Credential Definition ID"
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccd9ff",
              marginBottom: "12px",
            }}
          />

          {/* Proof Request JSON */}
          <label style={{ fontWeight: 500, color: "#003366" }}>
            Proof Request Object:
          </label>
          <textarea
            rows={12}
            value={proofRequestJson}
            onChange={(e) => setProofRequestJson(e.target.value)}
            placeholder={`{
  "connection_id": "<Enter a valid Connection ID>",
  "proof_request": {
    "name": "Proof of Insurance Eligibility",
    "version": "1.0",
    "requested_attributes": {
      "0_name_uuid": {
        "name": "name",
        "restrictions": [
          { "cred_def_id": "<Enter a valid Credential Definition ID>" }
        ]
      }
    },
    "requested_predicates": {}
  }
}`}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccd9ff",
              fontFamily: "monospace",
              fontSize: "14px",
              marginBottom: "16px",
              backgroundColor: "#f8faff",
            }}
          />

          <button
            onClick={sendProofRequest}
            style={{
              backgroundColor: "#003366",
              color: "white",
              padding: "12px 20px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
              width: "100%",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#004080")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#003366")}
          >
            Request Proof
          </button>
        </div>
      )}
    </div>
  );
}
