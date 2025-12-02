import { useEffect, useState } from "react";

const INSURER_API_BASE = "http://localhost:5070";

const DEMO_INSURED_ID = "patient-001";

export default function MyClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);

  // 載入列表
  useEffect(() => {
    async function fetchClaims() {
      setLoading(true);
      try {
        const res = await fetch(
          `${INSURER_API_BASE}/api/claim/list?insuredId=${encodeURIComponent(
            DEMO_INSURED_ID
          )}`
        );
        const data = await res.json();
        if (data.ok) {
          setClaims(data.claims || []);
        } else {
          console.error("list claims error:", data.error);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchClaims();
  }, []);

  const handleSelectClaim = async (claimId) => {
    try {
      const res = await fetch(
        `${INSURER_API_BASE}/api/claim/${encodeURIComponent(claimId)}`
      );
      const data = await res.json();
      if (data.ok) {
        setSelectedClaim(data.claim);
      } else {
        alert("讀取理賠申請失敗：" + (data.error || "unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("讀取理賠申請失敗：" + err.message);
    }
  };

  const thBase = {
    padding: "8px 12px",
    borderBottom: "1px solid #e2e8f0",
    fontWeight: 600,
    fontSize: "13px",
    color: "#1f2937",
    backgroundColor: "#eff6ff",
  };

  const tdBase = {
    padding: "8px 12px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "13px",
    color: "#111827",
    verticalAlign: "middle",
  };


  return (
    <div style={{ padding: "24px 16px", maxWidth: "900px", margin: "0 auto" }}>
      <h2
        style={{
          color: "#003366",
          borderBottom: "3px solid #cce0ff",
          paddingBottom: "8px",
          marginBottom: "16px",
          fontWeight: 600,
        }}
      >
        我的理賠申請
      </h2>

      {loading ? (
        <p>載入中...</p>
      ) : claims.length === 0 ? (
        <p>目前沒有理賠申請。</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
            tableLayout: "fixed",
          }}
        >
          {/* 固定每欄寬度 */}
          <colgroup>
            <col style={{ width: "20%" }} /> {/* Claim ID */}
            <col style={{ width: "15%" }} /> {/* 狀態 */}
            <col style={{ width: "23%" }} /> {/* 醫院 */}
            <col style={{ width: "25%" }} /> {/* 住院期間 */}
            <col style={{ width: "23%" }} /> {/* 預估金額 */}
          </colgroup>

          <thead>
            <tr>
              <th style={{ ...thBase, textAlign: "center" }}>Claim ID</th>
              <th style={{ ...thBase, textAlign: "center" }}>狀態</th>
              <th style={{ ...thBase, textAlign: "center" }}>醫院</th>
              <th style={{ ...thBase, textAlign: "center" }}>住院期間</th>
              <th style={{ ...thBase, textAlign: "center" }}>預估金額</th>
            </tr>
          </thead>

          <tbody>
            {claims.map((c) => (
              <tr
                key={c.claimId}
                onClick={() => handleSelectClaim(c.claimId)}
                style={{
                  cursor: "pointer",
                  backgroundColor:
                    selectedClaim?.claimId === c.claimId
                      ? "#eef2ff"
                      : "transparent",
                }}
              >
                <td
                  style={{
                    ...tdBase,
                    textAlign: "center",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                >
                  {c.claimId}
                </td>
                <td style={{ ...tdBase, textAlign: "center" }}>{c.status}</td>
                <td style={{ ...tdBase, textAlign: "center" }}>{c.hospitalName || "-"}</td>
                <td style={{ ...tdBase, textAlign: "center" }}>
                  {c.admissionDate || "-"} ~ {c.dischargeDate || "-"}
                </td>
                <td style={{ ...tdBase, textAlign: "center" }}> {c.estimatedPayout} 元</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedClaim && (
        <div
          style={{
            marginTop: "16px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "14px 16px",
            backgroundColor: "#f8fafc",
          }}
        >
          <h3 style={{ marginTop: 0, fontSize: "15px" }}>
            理賠申請詳細：{selectedClaim.claimId}
          </h3>
          <p style={{ margin: "4px 0" }}>狀態：{selectedClaim.status}</p>
          <p style={{ margin: "4px 0" }}>保單：{selectedClaim.policyId}</p>
          <p style={{ margin: "4px 0" }}>醫院：{selectedClaim.hospitalName}（{selectedClaim.hospitalId}）</p>
          <p style={{ margin: "4px 0" }}>
            住院期間：{selectedClaim.admissionDate} ~{" "}
            {selectedClaim.dischargeDate}
          </p>
          <p style={{ margin: "4px 0" }}>
            試算金額：{selectedClaim.preview?.totalPayout} 元
          </p>
          <div style={{ marginTop: "8px" }}>
            <div style={{ fontWeight: 600, fontSize: "13px" }}>試算理由：</div>
            <ul style={{ paddingLeft: "18px", margin: 0, fontSize: "12px" }}>
              {selectedClaim.preview?.breakdown?.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
