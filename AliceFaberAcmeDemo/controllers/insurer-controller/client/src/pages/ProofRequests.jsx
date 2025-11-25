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
  const [deletingId, setDeletingId] = useState(null);


  //  抓取 Proof 紀錄
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

  //  抓取 Connections
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

  //  發送 Proof Request
  const sendProofRequest = async () => {
  try {
    if (!connectionId) {
      alert("⚠️ Please select a connection first.");
      return;
    }

    // 預設的 proof_request（如果 textarea 空的時候用）
    const defaultProofRequest = {
      proof_request: {
        name: "Simple Test",
        version: "1.0",
        requested_attributes: {
          "attr1_name": {
            name: "name",
            // restrictions: [
            //   {
            //     cred_def_id:
            //       credentialDefId ||
            //       "<Enter a valid Credential Definition ID>",
            //   },
            // ],
          },
        },
        requested_predicates: {},
      },
    };

    let parsed = null;

    if (proofRequestJson.trim()) {
      // 使用者有在 textarea 寫東西
      parsed = JSON.parse(proofRequestJson);

      // 如果他只貼裡面的 proof_request，就包一層
      if (!parsed.proof_request) {
        parsed = { proof_request: parsed };
      }
    }

    // 最終要送給後端的 payload
    const payload = {
      // 一律用上方 select 選到的這條 connection
      connection_id: connectionId,
      //proof_request 用 textarea（若有）或 default
      proof_request: (parsed || defaultProofRequest).proof_request,
    };

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

  // 刪除一筆 proof record
const handleDeleteProof = async (id) => {
  const ok = window.confirm("確定要刪除這筆 proof 紀錄嗎？");
  if (!ok) return;

  try {
    setDeletingId(id);
    const res = await fetch(`/api/proofs/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!data.ok) {
      alert("❌ 刪除失敗：" + data.error);
    } else {
      // 刪掉本地 state 裡的這一筆，或重新 fetch
      setProofs((prev) =>
        (prev || []).filter(
          (p) =>
            (p.presentation_exchange_id || p.pres_ex_id || p._id) !== id
        )
      );
    }
  } catch (err) {
    console.error(err);
    alert("❌ 刪除時發生錯誤：" + err.message);
  } finally {
    setDeletingId(null);
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
      {/*  頁面標題 */}
      <h2
        style={{
          color: "#003366",
          borderBottom: "3px solid #cce0ff",
          paddingBottom: "8px",
          marginTop: "3px",
          marginBottom: "20px",
          fontWeight: 600,
          fontSize: "28px",
        }}
      >
        Proof Requests
      </h2>

      {/*  Tabs */}
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

      {/*  Proofs 列表 */}
      {activeTab === "proofs" && (
        <div>
          {loading ? (
            <p>Loading proofs...</p>
          ) : proofs.length === 0 ? (
            <p>No proofs available.</p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {proofs.map((p) => {
                const id = p.presentation_exchange_id || p.pres_ex_id || p._id;

                return (
                  <div
                    key={id}
                    style={{
                      backgroundColor: "white",
                      borderRadius: "8px",
                      padding: "16px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                      transition: "all 0.2s ease",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p>
                        <strong>ID:</strong> {id}
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

                    <button
                      onClick={() => handleDeleteProof(id)}
                      disabled={deletingId === id}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: "#e11d48",
                        color: "white",
                        cursor: deletingId === id ? "not-allowed" : "pointer",
                        fontWeight: 500,
                        minWidth: "90px",
                      }}
                    >
                      {deletingId === id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/*  Request Proof 表單 */}
      {activeTab === "request" && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "10px",
            padding: "24px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h4 style={{ color: "#003366", marginBottom: "12px" ,marginTop: "5px", fontSize: "20px", fontWeight: 600}}>
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
