import { useEffect, useState } from "react";

export default function ProofRequestsPage() {
  const [proofs, setProofs] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // 哪一筆正在 Accept / Decline
  const [workingId, setWorkingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // 每一筆 proof 選到哪些 requested_attributes（存 referent key）
  const [selectedAttrsByProofId, setSelectedAttrsByProofId] = useState({});

  // 「顯示完整 VC 欄位」用
  const [fullAttrsByProofId, setFullAttrsByProofId] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [loadingFullAttrsId, setLoadingFullAttrsId] = useState(null);

  // 把 proof record 解析成 { referent, name }
  const extractRequestedAttrs = (p) => {
    const proofReq =
      p.presentation_request?.proof_request ||
      p.presentation_request ||
      p.proof_request ||
      null;

    const reqAttrs = proofReq?.requested_attributes || {};
    return Object.entries(reqAttrs).map(([referent, cfg]) => ({
      referent,
      name:
        cfg.name ||
        (Array.isArray(cfg.names) ? cfg.names[0] : null) ||
        referent,
    }));
  };

  // 讀取所有 proof records
  const fetchProofs = async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/proofs");
      const data = await res.json();
      if (!data.ok) {
        alert("❌ Failed to load proof requests: " + data.error);
        return;
      }

      const list = data.results || [];
      setProofs(list);

      // 初始化每一筆 proof 的「已選 referents」＝所有 requested_attributes
      const initSelection = {};
      list.forEach((p) => {
        const id =
          p.presentation_exchange_id || p.pres_ex_id || p._id || p.id;
        const requested = extractRequestedAttrs(p);
        initSelection[id] = new Set(requested.map((x) => x.referent));
      });
      setSelectedAttrsByProofId(initSelection);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchProofs();
  }, []);

  // 讀取某一筆 proof 可用的 credential attrs（整張 VC）
  const loadFullAttrs = async (proofId) => {
    // 有 cache 就不用再打
    if (fullAttrsByProofId[proofId]) return;

    setLoadingFullAttrsId(proofId);
    try {
      const res = await fetch(`/api/proofs/${proofId}/credentials`);
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "load credentials failed");
      }

      const list = data.results || [];
      const first = list[0];
      const attrs = first?.cred_info?.attrs || first?.attrs || {};

      setFullAttrsByProofId((prev) => ({
        ...prev,
        [proofId]: attrs,
      }));
    } catch (e) {
      alert("❌ 載入完整就醫憑證欄位失敗：" + e.message);
    } finally {
      setLoadingFullAttrsId(null);
    }
  };

  // Accept = 送出 ZKP presentation（只帶被勾選的 referents）
  const handleAccept = async (proofId) => {
    setWorkingId(proofId);
    setActionLoading(true);
    try {
      const selectedSet = selectedAttrsByProofId[proofId];
      const selectedReferents = selectedSet
        ? Array.from(selectedSet)
        : undefined;

      const res = await fetch(`/api/proofs/${proofId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedReferents }),
      });

      const data = await res.json();
      if (!data.ok) {
        alert("❌ 接受 proof 失敗：" + data.error);
      } else {
        await fetchProofs();
      }
    } catch (e) {
      alert("❌ 接受 proof 發生錯誤：" + e.message);
    } finally {
      setActionLoading(false);
      setWorkingId(null);
    }
  };

  // Decline
  const handleDecline = async (proofId) => {
    if (!window.confirm("確定要拒絕這個 proof request 嗎？")) return;

    setWorkingId(proofId);
    setActionLoading(true);
    try {
      const res = await fetch(`/api/proofs/${proofId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: "User declined in Patient UI",
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert("❌ 拒絕 proof 失敗：" + data.error);
      } else {
        await fetchProofs();
      }
    } catch (e) {
      alert("❌ 拒絕 proof 發生錯誤：" + e.message);
    } finally {
      setActionLoading(false);
      setWorkingId(null);
    }
  };

  // UI style 一些共用的
  const chip = {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "999px",
    backgroundColor: "#e5edff",
    fontSize: "12px",
    marginRight: "6px",
    marginBottom: "4px",
  };

  return (
    <div
      style={{
        backgroundColor: "#f8faff",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
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

      {loadingList ? (
        <p>Loading proof requests...</p>
      ) : proofs.length === 0 ? (
        <p>No proof requests available.</p>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {proofs.map((p) => {
            const id =
              p.presentation_exchange_id ||
              p.pres_ex_id ||
              p._id ||
              p.id;
            const requestedAttrs = extractRequestedAttrs(p);
            const isWorking = id === workingId;

            const selectedSet = selectedAttrsByProofId[id] || new Set();

            return (
              <div
                key={id}
                style={{
                  backgroundColor: "white",
                  borderRadius: "10px",
                  padding: "18px 20px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}
              >
                {/* 基本資訊 */}
                <p style={{ margin: "0 0 4px" }}>
                  <strong>Request ID:</strong> {id}
                </p>
                <p style={{ margin: "0 0 4px" }}>
                  <strong>State:</strong>{" "}
                  <span
                    style={{
                      color:
                        p.state === "request_received"
                          ? "#2563eb"
                          : p.state === "verified"
                          ? "#16a34a"
                          : "#64748b",
                    }}
                  >
                    {p.state}
                  </span>
                </p>
                <p style={{ margin: "0 0 12px" }}>
                  <strong>Connection:</strong> {p.connection_id}
                </p>

                {/* 本次請求的欄位（摘要） */}
                <div
                  style={{
                    backgroundColor: "#eff4ff",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#1d4ed8",
                      marginBottom: "6px",
                    }}
                  >
                    本次請求的欄位（摘要）：
                  </div>
                  <div>
                    {requestedAttrs.map((a) => (
                      <span key={a.referent} style={chip}>
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 選擇要出示的欄位（只針對被要求的那些） */}
                <div
                  style={{
                    backgroundColor: "#eef2ff",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#3730a3",
                      }}
                    >
                      選擇要出示給保險公司的欄位
                    </div>
                    <div style={{ fontSize: "11px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          // 全選
                          setSelectedAttrsByProofId((prev) => ({
                            ...prev,
                            [id]: new Set(
                              requestedAttrs.map((a) => a.referent)
                            ),
                          }));
                        }}
                        style={{
                          marginRight: "8px",
                          border: "none",
                          background: "transparent",
                          color: "#2563eb",
                          cursor: "pointer",
                        }}
                      >
                        全選
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // 全部取消
                          setSelectedAttrsByProofId((prev) => ({
                            ...prev,
                            [id]: new Set(),
                          }));
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#64748b",
                          cursor: "pointer",
                        }}
                      >
                        全部取消
                      </button>
                    </div>
                  </div>

                  {requestedAttrs.map((a) => {
                    const checked = selectedSet.has(a.referent);
                    return (
                      <label
                        key={a.referent}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "12px",
                          marginBottom: "4px",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setSelectedAttrsByProofId((prev) => {
                              const current = new Set(prev[id] || []);
                              if (isChecked) current.add(a.referent);
                              else current.delete(a.referent);
                              return { ...prev, [id]: current };
                            });
                          }}
                        />
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            backgroundColor: checked
                              ? "#dbeafe"
                              : "#e5e7eb",
                            minWidth: "120px",
                            textAlign: "right",
                            color: "#1f2937",
                          }}
                        >
                          {a.name}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* 顯示「整張 VC 的 attributes」 */}
                <div
                  style={{
                    marginBottom: "10px",
                  }}
                >
                  <button
                    type="button"
                    onClick={async () => {
                      if (expandedId === id) {
                        setExpandedId(null);
                        return;
                      }
                      setExpandedId(id);
                      await loadFullAttrs(id);
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "999px",
                      border: "1px solid #cbd5f5",
                      backgroundColor: "#ffffff",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {expandedId === id
                      ? "隱藏完整就醫憑證欄位"
                      : loadingFullAttrsId === id
                      ? "載入中..."
                      : "顯示完整就醫憑證欄位"}
                  </button>

                  {expandedId === id && fullAttrsByProofId[id] && (
                    <div
                      style={{
                        marginTop: "8px",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        backgroundColor: "#f9fafb",
                        padding: "10px 12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          marginBottom: "8px",
                          color: "#0f172a",
                        }}
                      >
                        就醫憑證 Attributes（整張 VC）
                      </div>
                      <dl
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "minmax(0, 160px) minmax(0, 1fr)",
                          rowGap: "6px",
                          columnGap: "16px",
                          margin: 0,
                        }}
                      >
                        {Object.entries(fullAttrsByProofId[id]).map(
                          ([key, value]) => (
                            <div key={key} style={{ display: "contents" }}>
                              <dt
                                style={{
                                  justifySelf: "end",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "#64748b",
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "2px 10px",
                                    borderRadius: "999px",
                                    background: "#e5edff",
                                  }}
                                >
                                  {key}
                                </span>
                              </dt>
                              <dd
                                style={{
                                  margin: 0,
                                  fontSize: "13px",
                                  color: "#0f172a",
                                  wordBreak: "break-word",
                                  paddingTop: "4px",
                                }}
                              >
                                {value}
                              </dd>
                            </div>
                          )
                        )}
                      </dl>
                    </div>
                  )}
                </div>

                {/* 按鈕區：Decline / Accept */}
                <div
                  style={{
                    marginTop: "12px",
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-start",
                  }}
                >
                  <button
                    onClick={() => handleDecline(id)}
                    disabled={actionLoading}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "999px",
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

                  <button
                    onClick={() => handleAccept(id)}
                    disabled={actionLoading}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "999px",
                      border: "none",
                      backgroundColor: "#2563eb",
                      color: "#fff",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      fontWeight: 500,
                      opacity: isWorking && actionLoading ? 0.7 : 1,
                    }}
                  >
                    {isWorking && actionLoading
                      ? "Sending ZKP..."
                      : "確認送出 ZKP"}
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
