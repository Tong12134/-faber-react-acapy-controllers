import { useState, useEffect } from "react";

export default function ProofRequestsPage() {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);       // 載入列表用
  const [workingId, setWorkingId] = useState(null);   // 哪一筆正在 Accept / Decline
  const [actionLoading, setActionLoading] = useState(false); // 按鈕中的 loading

  const fetchProofs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proofs");
      const data = await res.json();
      if (data.ok) {
        setProofs(data.results || []);
      } else {
        alert("❌ Failed to load proof requests: " + data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProofs();
  }, []);

  // 接受某一筆 proof request
  const handleAccept = async (id) => {
    setWorkingId(id);
    setActionLoading(true);
    try {
      const res = await fetch(`/api/proofs/${id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!data.ok) {
        alert("接受 proof 失敗：" + data.error);
      } else {
        // 成功後重新載入列表（或直接把那筆從 state 移除也可以）
        await fetchProofs();
      }
    } catch (e) {
      alert("接受 proof 發生錯誤：" + e.message);
    } finally {
      setActionLoading(false);
      setWorkingId(null);
    }
  };

  // 拒絕某一筆 proof request
  const handleDecline = async (id) => {
    const confirmDecline = window.confirm("確定要拒絕這個 proof request 嗎？");
    if (!confirmDecline) return;

    setWorkingId(id);
    setActionLoading(true);
    try {
      const res = await fetch(`/api/proofs/${id}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "User declined in Patient UI" }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert("拒絕 proof 失敗：" + data.error);
      } else {
        await fetchProofs();
      }
    } catch (e) {
      alert("拒絕 proof 發生錯誤：" + e.message);
    } finally {
      setActionLoading(false);
      setWorkingId(null);
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

      {loading ? (
        <p>Loading proof requests...</p>
      ) : proofs.length === 0 ? (
        <p>No proof requests available.</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {proofs.map((p) => {
            const id = p.presentation_exchange_id || p.pres_ex_id || p._id;
            const isWorking = id === workingId;

            return (
              <div
                key={id}
                style={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  padding: "16px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                }}
              >
                <p>
                  <strong>Request ID:</strong> {id}
                </p>
                <p>
                  <strong>State:</strong>{" "}
                  <span
                    style={{ color: p.state === "verified" ? "green" : "#666" }}
                  >
                    {p.state}
                  </span>
                </p>
                <p>
                  <strong>Connection:</strong> {p.connection_id}
                </p>

                {/* 按鈕區 */}
                <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleAccept(id)}
                    disabled={actionLoading}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: "#2d6a4f",
                      color: "#fff",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      fontWeight: 500,
                      opacity: isWorking && actionLoading ? 0.7 : 1,
                    }}
                  >
                    {isWorking && actionLoading ? "Accepting..." : "Accept"}
                  </button>

                  <button
                    onClick={() => handleDecline(id)}
                    disabled={actionLoading}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: "#e11d48",
                      color: "#fff",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      fontWeight: 500,
                      opacity: isWorking && actionLoading ? 0.7 : 1,
                    }}
                  >
                    {isWorking && actionLoading ? "Declining..." : "Decline"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
