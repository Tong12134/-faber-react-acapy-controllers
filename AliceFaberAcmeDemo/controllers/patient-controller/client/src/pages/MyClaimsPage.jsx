// client/src/pages/MyClaimsPage.jsx
import { useEffect, useState } from "react";

const INSURER_API_BASE = "http://localhost:5070";
const DEMO_INSURED_ID = "patient-001";

export default function MyClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);

  // 新增：發起 proof request 的 loading
  const [startingClaim, setStartingClaim] = useState(false);

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

  // === 新增：按下「我要申請理賠」 → 請 Insurer 發 proof request ===
const handleCreateClaim = async () => {
  try {
    const res = await fetch(`${INSURER_API_BASE}/api/proofs/claim-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ /* 目前可以先傳空物件或帶 insuredId */ }),
    });
    const data = await res.json();
    if (!data.ok) {
      throw new Error(data.error || "unknown error");
    }
    alert("已送出 Proof Request，請稍後在錢包中查看新的驗證請求。");
  } catch (err) {
    alert("啟動理賠申請失敗：" + err.message);
  }
};

  // --- 樣式定義 ---
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

  const primaryButtonStyle = {
    backgroundColor: startingClaim ? "#a78bfa" : "#6d28d9", // 紫色主色
    color: "white",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: startingClaim ? "wait" : "pointer",
    fontWeight: "600",
    fontSize: "14px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  };

  return (
    <div style={{ padding: "24px 16px", maxWidth: "900px", margin: "0 auto" }}>
      {/* Header：左標題 + 右按鈕 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "3px solid #cce0ff",
          paddingBottom: "8px",
          marginBottom: "16px",
        }}
      >
        <h2 style={{ margin: 0, color: "#003366", fontWeight: 600 }}>
          我的理賠申請
        </h2>

        {/* 右上角主要按鈕 */}
        <button onClick={handleCreateClaim} style={primaryButtonStyle}>
          <span>＋</span>
          {startingClaim ? "送出中…" : "我要申請理賠"}
        </button>
      </div>

      {loading ? (
        <p>載入中...</p>
      ) : claims.length === 0 ? (
        // 空狀態：再引導一次
        <div
          style={{
            textAlign: "center",
            padding: "40px 0",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            border: "1px dashed #e5e7eb",
          }}
        >
          <p style={{ color: "#6b7280", marginBottom: "16px" }}>
            目前沒有理賠申請。
          </p>
          <button
            onClick={handleCreateClaim}
            style={{ ...primaryButtonStyle, margin: "0 auto" }}
          >
            {startingClaim ? "送出中…" : "立即申請第一筆理賠"}
          </button>
        </div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: "20%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "23%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "23%" }} />
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
                  transition: "background-color 0.2s",
                }}
              >
                <td
                  style={{
                    ...tdBase,
                    textAlign: "center",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                >
                  {c.claimId}
                </td>
                <td style={{ ...tdBase, textAlign: "center" }}>{c.status}</td>
                <td style={{ ...tdBase, textAlign: "center" }}>
                  {c.hospitalName || "-"}
                </td>
                <td style={{ ...tdBase, textAlign: "center" }}>
                  {c.admissionDate || "-"} ~ {c.dischargeDate || "-"}
                </td>
                <td style={{ ...tdBase, textAlign: "center" }}>
                  {c.estimatedPayout} 元
                </td>
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
          <p style={{ margin: "4px 0" }}>
            醫院：{selectedClaim.hospitalName}（{selectedClaim.hospitalId}）
          </p>
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
