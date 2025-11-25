import { useState, useEffect } from "react";

// 依目前選到的 connectionId / credentialDefId，組出 textarea 要顯示的 JSON
const buildProofRequestJson = (connectionId, credentialDefId) => {
  const credDef =
    credentialDefId && credentialDefId.trim()
      ? credentialDefId.trim()
      : "<Enter a valid Credential Definition ID>";

  const conn =
    connectionId && connectionId.trim()
      ? connectionId.trim()
      : "<Enter a valid Connection ID>";

  const obj = {
    connection_id: conn,
    proof_request: {
      name: "Proof of Hospital Diagnosis",
      version: "1.0",
      requested_attributes: {
        attr1_name: {
          name: "name",
          restrictions: [
            {
              cred_def_id: credDef,
            },
          ],
        },
      },
      requested_predicates: {},
    },
  };

  return JSON.stringify(obj, null, 2);
};

export default function ProofRequestsPage() {
  const [activeTab, setActiveTab] = useState("proofs");
  const [proofs, setProofs] = useState([]);
  const [connections, setConnections] = useState([]);
  const [credentialDefId, setCredentialDefId] = useState("");
  const [connectionId, setConnectionId] = useState("");
  // 🔧 這裡改成用 buildProofRequestJson，而不是 DEFAULT_PROOF_REQUEST_JSON
  const [proofRequestJson, setProofRequestJson] = useState(
    buildProofRequestJson("", "")
  );
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // 抓取 Proof 紀錄
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

  // 抓取 Connections
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

  // 發送 Proof Request
  const sendProofRequest = async () => {
    try {
      if (!connectionId) {
        alert("⚠️ Please select a connection first.");
        return;
      }

      // 預設 proof_request（如果 textarea 被清空或 parse 失敗時用）
      const defaultProofRequest = {
        proof_request: {
          name: "Proof of Hospital Diagnosis",
          version: "1.0",
          requested_attributes: {
            attr1_name: {
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

      let parsed = null;

      if (proofRequestJson.trim()) {
        try {
          parsed = JSON.parse(proofRequestJson);

          // 如果使用者只填 proof_request 本體，就幫他包一層
          if (!parsed.proof_request) {
            parsed = { proof_request: parsed };
          }
        } catch (e) {
          alert("❌ Proof Request JSON 不是合法 JSON，將改用預設值。\n" + e.message);
          parsed = null;
        }
      }

      const payload = {
        // 一律用上面選到的 connection
        connection_id: connectionId,
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

  // 選 connection：更新 connectionId + credentialDefId + textarea JSON
  const handleConnectionChange = (e) => {
    const connId = e.target.value;
    setConnectionId(connId);

    // 1) 上面的輸入框直接帶入這條 connection 的 ID
    setCredentialDefId(connId);

    // 2) textarea 的 JSON 也用同一個值當 cred_def_id
    setProofRequestJson(buildProofRequestJson(connId, connId));
  };



  // 2) 改 Credential Definition ID：更新 credentialDefId + JSON（cred_def_id 會跟著變）
  const handleCredDefChange = (e) => {
    const newCredDef = e.target.value;
    setCredentialDefId(newCredDef);

    // 用「目前的 connectionId + 新的 credDef」重組 JSON
    setProofRequestJson(buildProofRequestJson(connectionId, newCredDef));
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
      {/* 頁面標題 */}
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

      {/* Tabs */}
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

      {/* Proofs 列表 */}
      {activeTab === "proofs" && (
        <div>
          {loading ? (
            <p>Loading proofs...</p>
          ) : proofs.length === 0 ? (
            <p>No proofs available.</p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {proofs.map((p) => {
                const id =
                  p.presentation_exchange_id || p.pres_ex_id || p._id;

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
                        cursor:
                          deletingId === id ? "not-allowed" : "pointer",
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

      {/* Request Proof 表單 */}
      {activeTab === "request" && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "10px",
            padding: "24px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h4
            style={{
              color: "#003366",
              marginBottom: "12px",
              marginTop: "5px",
              fontSize: "20px",
              fontWeight: 600,
            }}
          >
            Request Proof
          </h4>

          {/* Connection */}
          <label style={{ fontWeight: 500, color: "#003366" }}>
            Select a Connection
          </label>
          <select
            value={connectionId}
            onChange={handleConnectionChange}
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
            Enter a Credential Definition ID : 
          </label>
          <input
            type="text"
            value={credentialDefId}
            onChange={handleCredDefChange}
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
          ></textarea>

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

      {message && (
        <p style={{ marginTop: "16px", color: "#b91c1c" }}>{message}</p>
      )}
    </div>
  );
}
