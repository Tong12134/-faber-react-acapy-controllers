// controllers/insurer-controller/client/src/Claims.jsx
import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5070";

export default function ClaimsDashboard() {
  const [claims, setClaims] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [filterStatus, setFilterStatus] = useState("ALL");

  // 1) 載入理賠列表
  useEffect(() => {
    async function fetchClaims() {
      setLoadingList(true);
      setListError("");
      try {
        const res = await fetch(`${API_BASE}/api/claim/list`);
        const data = await res.json();
        if (!data.ok) {
          throw new Error(data.error || "Failed to load claims");
        }
        setClaims(data.claims || []);
      } catch (err) {
        console.error("list claims error:", err);
        setListError(err.message || String(err));
      } finally {
        setLoadingList(false);
      }
    }

    fetchClaims();
  }, []);

  // 2) 載入單一 claim 詳細
  const loadClaimDetail = async (claimId) => {
    setSelectedClaimId(claimId);
    setSelectedClaim(null);
    setDetailError("");
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_BASE}/api/claim/${encodeURIComponent(claimId)}`);
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to load claim");
      }
      setSelectedClaim(data.claim);
    } catch (err) {
      console.error("get claim error:", err);
      setDetailError(err.message || String(err));
    } finally {
      setLoadingDetail(false);
    }
  };

  // 狀態過濾
  const filteredClaims =
    filterStatus === "ALL"
      ? claims
      : claims.filter((c) => c.status === filterStatus);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 360px) minmax(0, 1fr)",
        gap: "16px",
        padding: "24px 16px",
        height: "100vh",
        boxSizing: "border-box",
        backgroundColor: "#f3f4f6",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* 左邊：列表 */}
      <section
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div
          style={{
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "8px",
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            理賠申請列表
          </h2>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              fontSize: "12px",
              padding: "4px 8px",
              borderRadius: "999px",
              border: "1px solid #d1d5db",
              backgroundColor: "#f9fafb",
              color: "#374151",
            }}
          >
            <option value="ALL">全部狀態</option>
            <option value="RECEIVED">RECEIVED</option>
            <option value="IN_REVIEW">IN_REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="DENIED">DENIED</option>
            <option value="PAID">PAID</option>
          </select>
        </div>

        {loadingList ? (
          <p style={{ fontSize: "13px", color: "#6b7280" }}>載入中...</p>
        ) : listError ? (
          <p style={{ fontSize: "13px", color: "#b91c1c" }}>
            載入失敗：{listError}
          </p>
        ) : filteredClaims.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#6b7280" }}>目前沒有理賠申請。</p>
        ) : (
          <div
            style={{
              marginTop: "4px",
              overflowY: "auto",
              paddingRight: "4px",
            }}
          >
            {filteredClaims.map((c) => {
              const isActive = c.claimId === selectedClaimId;

              return (
                <button
                  key={c.claimId}
                  onClick={() => loadClaimDetail(c.claimId)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "1px solid " + (isActive ? "#4f46e5" : "#e5e7eb"),
                    backgroundColor: isActive ? "#eef2ff" : "#ffffff",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    marginBottom: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      {c.claimId}
                    </span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#4b5563",
                      marginBottom: "2px",
                    }}
                  >
                    醫院：{c.hospitalName || "-"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>
                    住院期間：{c.admissionDate || "-"} ~{" "}
                    {c.dischargeDate || "-"}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#111827",
                      marginTop: "2px",
                    }}
                  >
                    預估金額：{c.estimatedPayout} 元
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 右邊：詳細 */}
      <section
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "8px",
            marginBottom: "8px",
          }}
        >
          理賠申請詳細
        </h2>

        {!selectedClaimId && (
          <p style={{ fontSize: "13px", color: "#6b7280" }}>
            請從左側選擇一筆理賠申請。
          </p>
        )}

        {selectedClaimId && loadingDetail && (
          <p style={{ fontSize: "13px", color: "#6b7280" }}>
            正在載入 {selectedClaimId} 的詳細資料...
          </p>
        )}

        {detailError && (
          <p style={{ fontSize: "13px", color: "#b91c1c" }}>
            載入失敗：{detailError}
          </p>
        )}

        {selectedClaim && !loadingDetail && (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              paddingRight: "4px",
              fontSize: "13px",
              color: "#111827",
            }}
          >
            {/* 基本資訊 */}
            <section style={{ marginBottom: "12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "4px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    Claim ID：{selectedClaim.claimId}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginTop: "2px",
                    }}
                  >
                    保單：{selectedClaim.policyId}｜被保人：
                    {selectedClaim.insuredId}
                  </div>
                </div>
                <StatusBadge status={selectedClaim.status} />
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                建立時間：{selectedClaim.createdAt}
                <br />
                更新時間：{selectedClaim.updatedAt}
              </div>
            </section>

            {/* 就醫摘要 */}
            <section
              style={{
                marginBottom: "12px",
                padding: "10px 12px",
                borderRadius: "10px",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: "6px",
                  fontSize: "13px",
                }}
              >
                就醫摘要
              </div>
              <div style={{ fontSize: "12px", color: "#374151" }}>
                醫院：{selectedClaim.hospitalName}（
                {selectedClaim.hospitalId}）
                <br />
                就醫類型：{selectedClaim.encounterDTO?.encounterClass}
                <br />
                住院期間：
                {selectedClaim.encounterDTO?.admissionDate || "-"} ~{" "}
                {selectedClaim.encounterDTO?.dischargeDate || "-"}
                <br />
                診斷：
                {selectedClaim.encounterDTO?.diagnosisDisplay}（
                {selectedClaim.encounterDTO?.diagnosisCode}）
                <br />
                手術：
                {selectedClaim.encounterDTO?.procedureDisplay || "-"}（
                {selectedClaim.encounterDTO?.procedureCode || "-"}）
              </div>
            </section>

            {/* 試算結果 */}
            <section
              style={{
                marginBottom: "12px",
                padding: "10px 12px",
                borderRadius: "10px",
                backgroundColor: "#ecfdf3",
                border: "1px solid #bbf7d0",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: "6px",
                  fontSize: "13px",
                  color: "#166534",
                }}
              >
                試算理賠結果
              </div>
              <div
                style={{ fontSize: "13px", color: "#14532d", marginBottom: "4px" }}
              >
                可否理賠：
                {selectedClaim.preview?.eligible ? "可以" : "不可以"}
              </div>
              <div
                style={{ fontSize: "13px", color: "#14532d", marginBottom: "6px" }}
              >
                預估金額：{selectedClaim.preview?.totalPayout} 元
              </div>
              <div style={{ fontSize: "12px", color: "#166534" }}>
                理由：
                <ul style={{ paddingLeft: "18px", margin: "4px 0" }}>
                  {selectedClaim.preview?.breakdown?.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            </section>

            {/* 原始欄位（encounterDTO） */}
            <section
              style={{
                marginBottom: "12px",
                padding: "10px 12px",
                borderRadius: "10px",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: "6px",
                  fontSize: "13px",
                }}
              >
                內部 Encounter DTO
              </div>
              <pre
                style={{
                  backgroundColor: "#111827",
                  color: "#e5e7eb",
                  borderRadius: "8px",
                  padding: "8px",
                  fontSize: "11px",
                  overflowX: "auto",
                }}
              >
                {JSON.stringify(selectedClaim.encounterDTO, null, 2)}
              </pre>
            </section>

            {/* 原始 credentialAttrs（需要時可以打開） */}
            <section
              style={{
                marginBottom: "12px",
                padding: "10px 12px",
                borderRadius: "10px",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: "6px",
                  fontSize: "13px",
                }}
              >
                原始 Credential Attributes
              </div>
              <pre
                style={{
                  backgroundColor: "#111827",
                  color: "#e5e7eb",
                  borderRadius: "8px",
                  padding: "8px",
                  fontSize: "11px",
                  overflowX: "auto",
                }}
              >
                {JSON.stringify(selectedClaim.credentialAttrs, null, 2)}
              </pre>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

// 小小的狀態 Badge 元件
function StatusBadge({ status }) {
  let bg = "#e5e7eb";
  let color = "#374151";

  if (status === "RECEIVED") {
    bg = "#eff6ff";
    color = "#1d4ed8";
  } else if (status === "IN_REVIEW") {
    bg = "#fff7ed";
    color = "#c2410c";
  } else if (status === "APPROVED") {
    bg = "#ecfdf3";
    color = "#15803d";
  } else if (status === "DENIED") {
    bg = "#fef2f2";
    color = "#b91c1c";
  } else if (status === "PAID") {
    bg = "#fefce8";
    color = "#854d0e";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 600,
        backgroundColor: bg,
        color,
      }}
    >
      {status || "UNKNOWN"}
    </span>
  );
}
