import { useState, useEffect } from "react";

// 從 proof record 裡把 requested_attributes 抽出來
function getRequestedAttrs(rec) {
  const proofReq =
    rec.presentation_request?.proof_request ||
    rec.presentation_request ||
    rec.proof_request ||
    {};
  return proofReq.requested_attributes || {};
}

function getProofId(p) {
  return p.presentation_exchange_id || p.pres_ex_id || p._id || p.id;
}

export default function ProofRequestsPage() {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);       // 載入列表用
  const [workingId, setWorkingId] = useState(null);   // 哪一筆正在送出 / 拒絕
  const [actionLoading, setActionLoading] = useState(false); // 按鈕中的 loading

  //  新增：哪一筆 proof 正在挑欄位
  const [editingProofId, setEditingProofId] = useState(null);
  //  新增：每一筆 proof 勾選了哪些「referent」（attr1_xxx）
  const [selectedAttrsByProofId, setSelectedAttrsByProofId] = useState({});

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

  //  打開「欄位選擇」UI
  const openSelectAttrs = (proof) => {
    const id = getProofId(proof);
    const reqAttrs = getRequestedAttrs(proof);
    const allReferents = Object.keys(reqAttrs); // ["attr1_encounter_class", ...]

    setEditingProofId(id);
    setSelectedAttrsByProofId((prev) => ({
      ...prev,
      [id]: prev[id] || new Set(allReferents), // 預設全選
    }));
  };

  //  送出經過勾選的 ZKP presentation
  const handleConfirmAccept = async (proof) => {
    const id = getProofId(proof);
    const reqAttrs = getRequestedAttrs(proof);

    // 取出勾選的 referents
    const selectedSet =
      selectedAttrsByProofId[id] || new Set(Object.keys(reqAttrs));

    // 轉成真正的 attribute name 給後端
    const revealAttrNames = [];
    for (const ref of selectedSet) {
      const item = reqAttrs[ref] || {};
      const attrName =
        item.name ||
        (Array.isArray(item.names) ? item.names[0] : ref);
      revealAttrNames.push(attrName);
    }

    setWorkingId(id);
    setActionLoading(true);
    try {
      const res = await fetch(`/api/proofs/${encodeURIComponent(id)}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revealAttrNames }),   //  關鍵：把勾選結果送到後端
      });
      const data = await res.json();
      if (!data.ok) {
        alert("接受 proof 失敗：" + data.error);
      } else {
        alert("✅ 已送出 ZKP presentation");
        setEditingProofId(null);
        await fetchProofs();
      }
    } catch (e) {
      alert("接受 proof 發生錯誤：" + e.message);
    } finally {
      setActionLoading(false);
      setWorkingId(null);
    }
  };

  // 拒絕某一筆 proof request（維持原本邏輯）
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
            const id = getProofId(p);
            const isWorking = id === workingId;
            const requestedAttrs = getRequestedAttrs(p);
            const editingThis = editingProofId === id;

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

                {/* 大略顯示這次要哪些欄位 */}
                {Object.keys(requestedAttrs).length > 0 && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      backgroundColor: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      fontSize: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: "4px",
                        color: "#1d4ed8",
                      }}
                    >
                      本次請求的欄位（概要）：
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                      }}
                    >
                      {Object.entries(requestedAttrs).map(([ref, item]) => {
                        const attrName =
                          item.name ||
                          (Array.isArray(item.names)
                            ? item.names[0]
                            : ref);
                        return (
                          <span
                            key={ref}
                            style={{
                              padding: "2px 8px",
                              borderRadius: "999px",
                              backgroundColor: "#dbeafe",
                              color: "#1f2937",
                            }}
                          >
                            {attrName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 按鈕區 */}
                <div
                  style={{
                    marginTop: "12px",
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
                  {/* ✅ 改成：先選欄位 */}
                  <button
                    onClick={() => openSelectAttrs(p)}
                    disabled={actionLoading && isWorking}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: "#2563eb",
                      color: "#fff",
                      cursor:
                        actionLoading && isWorking ? "not-allowed" : "pointer",
                      fontWeight: 500,
                      opacity: editingThis ? 0.85 : 1,
                    }}
                  >
                    {editingThis ? "調整出示欄位..." : "選擇欄位後送出"}
                  </button>

                  <button
                    onClick={() => handleDecline(id)}
                    disabled={actionLoading && isWorking}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: "#e11d48",
                      color: "#fff",
                      cursor:
                        actionLoading && isWorking ? "not-allowed" : "pointer",
                      fontWeight: 500,
                      opacity: isWorking && actionLoading ? 0.7 : 1,
                    }}
                  >
                    {isWorking && actionLoading ? "Declining..." : "Decline"}
                  </button>
                </div>

                {/* ✅ 展開「勾選欄位 + 確認送出」 */}
                {editingThis && (
                  <div
                    style={{
                      marginTop: "12px",
                      borderRadius: "12px",
                      border: "1px solid #bfdbfe",
                      backgroundColor: "#eff6ff",
                      padding: "12px 14px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        marginBottom: "8px",
                        color: "#1d4ed8",
                      }}
                    >
                      選擇要出示給保險公司的欄位
                    </div>

                    <div
                      style={{
                        maxHeight: "220px",
                        overflowY: "auto",
                        paddingRight: "4px",
                        marginBottom: "10px",
                      }}
                    >
                      {Object.entries(requestedAttrs).map(([ref, item]) => {
                        const attrName =
                          item.name ||
                          (Array.isArray(item.names)
                            ? item.names[0]
                            : ref);

                        const selectedSet =
                          selectedAttrsByProofId[id] ||
                          new Set(Object.keys(requestedAttrs));
                        const checked = selectedSet.has(ref);

                        const toggle = () => {
                          setSelectedAttrsByProofId((prev) => {
                            const current =
                              prev[id] ||
                              new Set(Object.keys(requestedAttrs));
                            const next = new Set(current);
                            if (next.has(ref)) next.delete(ref);
                            else next.add(ref);
                            return { ...prev, [id]: next };
                          });
                        };

                        return (
                          <label
                            key={ref}
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
                              onChange={toggle}
                            />
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: "999px",
                                backgroundColor: checked
                                  ? "#dbeafe"
                                  : "#e5e7eb",
                                minWidth: "140px",
                                textAlign: "right",
                                color: "#1f2937",
                              }}
                            >
                              {attrName}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {/* 全選 / 取消全選 */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                        fontSize: "11px",
                      }}
                    >
                      <div />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            const allRefs = Object.keys(requestedAttrs);
                            setSelectedAttrsByProofId((prev) => ({
                              ...prev,
                              [id]: new Set(allRefs),
                            }));
                          }}
                          style={{
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
                          onClick={() =>
                            setSelectedAttrsByProofId((prev) => ({
                              ...prev,
                              [id]: new Set(),
                            }))
                          }
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

                    {/* 底部操作 */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "8px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setEditingProofId(null)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "999px",
                          border: "1px solid #cbd5f5",
                          backgroundColor: "white",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmAccept(p)}
                        disabled={actionLoading && isWorking}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "999px",
                          border: "none",
                          backgroundColor:
                            actionLoading && isWorking
                              ? "#bfdbfe"
                              : "#2563eb",
                          color: "white",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor:
                            actionLoading && isWorking
                              ? "wait"
                              : "pointer",
                        }}
                      >
                        {actionLoading && isWorking
                          ? "送出中..."
                          : "確認送出 ZKP"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
