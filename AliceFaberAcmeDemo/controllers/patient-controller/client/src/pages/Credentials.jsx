import { useState, useEffect } from "react";

// 1. 定義 DID 常數
const HOSPITAL_DID = "QWTxizRo9A1tWdEPYkFPHe";
const INSURER_DID = "HZnimaMX5B9zwh13thnNLG";

const DID_LABELS = {
  [HOSPITAL_DID]: "Hospital",
  [INSURER_DID]: "Insurer",
};

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState([]);
  const [offers, setOffers] = useState([]);
  
  // UI Loading States
  const [loadingCreds, setLoadingCreds] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);
  
  // Actions States
  const [acceptingId, setAcceptingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  
  // 讓每一張「醫院憑證」記住目前選擇的保單 VC ID
  const [policySelectionByCredId, setPolicySelectionByCredId] = useState({});

  // Claim Logic States
  const [previewingId, setPreviewingId] = useState(null); 
  const [claimPreviewByCredId, setClaimPreviewByCredId] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [submittedClaimByCredId, setSubmittedClaimByCredId] = useState({});
  const [selectedAttrsByCredId, setSelectedAttrsByCredId] = useState({});
  const [selectingPreviewForId, setSelectingPreviewForId] = useState(null);

  // Tab 狀態
  const [activeTab, setActiveTab] = useState("hospital"); // 'hospital' | 'insurer'

  const INSURER_API_BASE = "http://localhost:5070";
  const DEMO_INSURED_ID = "patient-001";
  const DEMO_POLICY_ID = "POLICY-DEMO-001";

  // Mock Data & Helpers
  const mockCredentialAttrs = {
    hospital_id: "HOSPITAL-001",
    encounter_id: "E2025-0001",
    diagnosis_code: "S7200",
    diagnosis_display: "Femur fracture",
    timestamp: "2025-06-06T10:00:00+08:00",
  };

  const getRawAttrsForCred = (cred) =>
    cred.attrs && Object.keys(cred.attrs).length > 0 ? cred.attrs : mockCredentialAttrs;

  const decorateCredentials = (rawList = []) =>
    (rawList || []).map((c) => {
      const credDefId = c.credential_definition_id || c.cred_def_id || "";
      const schemaId = c.schema_id || "";
      let issuerDid = c.issuerDid;
      if (!issuerDid && credDefId) issuerDid = credDefId.split(":")[0] || "";
      if (!issuerDid && schemaId) issuerDid = schemaId.split(":")[0] || "";
      const issuerLabel = DID_LABELS[issuerDid] || c.issuerLabel || issuerDid || "Unknown Issuer";
      return { ...c, issuerDid, issuerLabel };
    });

  // API Calls
  const fetchCredentials = async () => {
    setLoadingCreds(true);
    try {
      const res = await fetch("/api/credentials");
      const data = await res.json();
      if (data.ok) setCredentials(decorateCredentials(data.credentials || []));
    } catch (err) { console.error(err); } finally { setLoadingCreds(false); }
  };

  const fetchOffers = async () => {
    setLoadingOffers(true);
    try {
      const res = await fetch("/api/credentialOffers");
      const data = await res.json();
      if (data.ok) setOffers(data.offers || []);
    } catch (err) { console.error(err); } finally { setLoadingOffers(false); }
  };

  const handleDeleteCredential = async (credId) => {
    if (!window.confirm("確定要刪除這張 Credential 嗎？")) return;
    setDeletingId(credId);
    try {
      const res = await fetch(`/api/credentials/${credId}/remove`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setCredentials((prev) => prev.filter((c) => c.id !== credId));
    } catch (err) { alert("❌ 刪除失敗：" + err.message); } finally { setDeletingId(null); }
  };

  const handleAccept = async (offerId) => {
  if (!offerId) return;

  setAcceptingId(offerId);
  try {
    const res = await fetch(`/api/credentialOffers/${offerId}/accept`, {
      method: "POST",
    });
    const data = await res.json();

    if (!data.ok) {
      alert("❌ Accept failed: " + data.error);
      return;
    }

    // 等待 ACA-Py 自動 store 完成，再刷新 credentials
    let tries = 0;
    let stored = false;
    while (tries < 8 && !stored) {
      await new Promise((r) => setTimeout(r, 500));
      const checkRes = await fetch("/api/credentials");
      const checkData = await checkRes.json();
      if (
        checkData.ok &&
        decorateCredentials(checkData.credentials).length > credentials.length
      ) {
        setCredentials(decorateCredentials(checkData.credentials));
        stored = true;
      }
      tries++;
    }

    // 最後更新一次 pending offers（這筆應該會消失）
    await fetchOffers();
  } catch (err) {
    alert("❌ Accept Error: " + err.message);
  } finally {
    setAcceptingId(null);
  }
};

  const handleReject = async (offerId) => {
    if (!offerId) return;

    const ok = window.confirm("確定要拒絕這個 credential offer 嗎？");
    if (!ok) return;

    setRejectingId(offerId);
    try {
      const res = await fetch(`/api/credentialOffers/${offerId}/reject`, {
        method: "POST",
      });
      const data = await res.json();

      if (!data.ok) {
        alert("❌ Reject failed: " + data.error);
        return;
      }

      // 拒絕成功後，重新抓一次 offers，這張卡片就會消失
      await fetchOffers();
    } catch (err) {
      console.error(err);
      alert("❌ Error while rejecting offer: " + err.message);
    } finally {
      setRejectingId(null); // 這裡只要設回 null 就好
    }
  };


  // Claim Logic
  // (現在不再讓使用者勾欄位，直接用整張 VC 的 attrs)
  const getSelectedAttrsForCred = (cred) => {
    return getRawAttrsForCred(cred);
  };

  // const getSelectedAttrsForCred = (cred) => {
  //   const rawAttrs = getRawAttrsForCred(cred);
  //   const selectedKeys = selectedAttrsByCredId[cred.id];
  //   if (!selectedKeys || selectedKeys.size === 0) return rawAttrs;
  //   const subset = {};
  //   for (const [key, value] of Object.entries(rawAttrs)) {
  //     if (selectedKeys.has(key)) subset[key] = value;
  //   }
  //   return Object.keys(subset).length === 0 ? rawAttrs : subset;
  // };

  const openPreviewSelector = (cred) => {
    if (selectingPreviewForId === cred.id) {
      setSelectingPreviewForId(null);
      return;
    }
    setSelectingPreviewForId(cred.id);
    setExpandedId(null);
  };

  // const openPreviewSelector = (cred) => {
  //   if (selectingPreviewForId === cred.id) { setSelectingPreviewForId(null); return; }
  //   setSelectingPreviewForId(cred.id);
  //   setExpandedId(null); 
  //   setSelectedAttrsByCredId((prev) => prev[cred.id] ? prev : { ...prev, [cred.id]: new Set(Object.keys(getRawAttrsForCred(cred))) });
  // };

  // 找到一張要用來試算的保單 VC（先簡單用第一張 Insurer 發的 VC）
  const findPolicyCredential = () => {
    return credentials.find(
      (c) =>
        c.issuerDid === INSURER_DID ||
        c.issuerLabel === "Insurer"
    );
  };

  const handlePreviewClaim = async (cred) => {
    setPreviewingId(cred.id);
    try {
      // 1) 醫院 VC 的欄位（你原本就有）
      const hospitalAttrs = getSelectedAttrsForCred(cred);

      // 2) 找出這張醫院 VC 目前選擇的保單 VC
      const selectedPolicyId = policySelectionByCredId[cred.id];
      let policyAttrs = null;

      if (selectedPolicyId) {
        const policyCred = credentials.find((c) => c.id === selectedPolicyId);
        if (policyCred) {
          policyAttrs = getRawAttrsForCred(policyCred);
        }
      }

      // 3) 組 payload：新版後端吃 hospitalCredentialAttrs / policyCredentialAttrs
      const payload = {
        hospitalCredentialAttrs: hospitalAttrs,
      };
      if (policyAttrs) {
        payload.policyCredentialAttrs = policyAttrs;
      }

      const res = await fetch(
        `${INSURER_API_BASE}/api/claim/preview-from-hospital-credential`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      setClaimPreviewByCredId((prev) => ({ ...prev, [cred.id]: data.preview }));
    } catch (err) {
      alert("❌ 試算失敗：" + err.message);
    } finally {
      setPreviewingId(cred.id);
      setPreviewingId(null);
    }
  };

  // 用這張醫療 VC 觸發 ZKP 理賠流程（發 proof request 給 Insurer）
  const handleSubmitClaim = async (cred) => {
    setSubmittingId(cred.id);
    try {
      // 1) 先拿這張 VC 的原始 attrs
      const attrs = getRawAttrsForCred(cred);

      // 2) 目前還是用 encounter_id；之後加了 encounter_global_id 再替換
      const encounterId = attrs.encounter_global_id || attrs.encounter_id;

      if (!encounterId) {
        throw new Error(
          "這張醫療憑證沒有 encounter_id / encounter_global_id，無法申請理賠"
        );
      }

      // 3) 呼叫 Insurer 的 ZKP 理賠 API（注意路徑 & 欄位名稱）
      const res = await fetch(
        `${INSURER_API_BASE}/api/proofs/claim-request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            encounter_id: encounterId,      // ⭐ 跟後端對上
            insuredId: DEMO_INSURED_ID,     // demo 用，看你要不要
          }),
        }
      );

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "unknown error");

      // 4) 前端自己記錄一下「已送出 ZKP 理賠請求」（純顯示用）
      setSubmittedClaimByCredId((prev) => ({
        ...prev,
        [cred.id]: {
          status: "ZKP_REQUEST_SENT",
          proofExId:
            data.result?.presentation_exchange_id ||
            data.result?.pres_ex_id ||
            data.result?.id ||
            null,
        },
      }));

      alert("✅ 已發送 ZKP 證明請求，請到 Proofs 頁面查看並按 Accept。");
    } catch (err) {
      alert("❌ 理賠 ZKP 發送失敗：" + err.message);
    } finally {
      setSubmittingId(null);
      setSelectingPreviewForId(null);
    }
  };



  useEffect(() => { fetchCredentials(); fetchOffers(); }, []);


  // 全部 VC 中，挑出由 Insurer 發的（當保單使用）
const insurerCredentials = credentials.filter(
  (cred) =>
    cred.issuerDid === INSURER_DID || cred.issuerLabel === "Insurer"
);


  // Filter Logic
  const filteredCredentials = [...credentials].reverse().filter((cred) => {
    return activeTab === "hospital" 
      ? (cred.issuerDid === HOSPITAL_DID || cred.issuerLabel === "Hospital")
      : (cred.issuerDid === INSURER_DID || cred.issuerLabel === "Insurer");
  });

  // --- STYLES (Aligned with Screenshots) ---

  const styles = {
    // 獨立的藍色直條
    blueBar: {
      width: "5px",
      height: "28px", // 稍微加高以配合文字
      backgroundColor: "#3b82f6", // Royal blue
      marginRight: "14px",
      borderRadius: "2px",
    },
    
    // 標題容器：左右撐開 (space-between)
    headerRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between", // 讓左邊的標題和右邊的 Tab 分開
      marginBottom: "20px",
      height: "40px",
    },

    // 標題左側組合 (藍條 + 文字)
    titleGroup: {
      display: "flex",
      alignItems: "center",
    },

    // 標題文字
    sectionTitleText: {
      color: "#0f172a", // Dark slate
      fontWeight: "700",
      fontSize: "24px",
      margin: 0,
      lineHeight: 1, // 確保垂直置中更好對齊
    },

    // Tab 切換器容器 (靠右)
    tabContainer: {
      backgroundColor: "#f8fafc",
      padding: "4px",
      borderRadius: "999px",
      display: "flex",
      gap: "4px",
    },

    // 卡片基礎
    cardBase: {
      backgroundColor: "#ffffff",
      border: "1px solid #eef2ff",
      borderRadius: "12px",
      padding: "24px 28px",
      marginBottom: "16px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
    },

    // 整排按鈕容器
    btnRow: {
      display: "flex",
      alignItems: "center",
      marginTop: "24px",
    },

    leftActions: {
      display: "flex",
      gap: "12px",
    },

    // 右側按鈕群組（試算 / 送出 / Delete）
    actionGroupRight: {
      display: "flex",
      gap: "12px",
      marginLeft: "auto", // 把整組推到最右邊
    },

    // 三個按鈕共用：同寬同高
    actionBtn: {
      padding: "8px 20px",
      borderRadius: "999px",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      border: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "opacity 0.2s, transform 0.15s",
    },
    
    // 資訊行
    infoRow: {
      marginBottom: "10px",
      fontSize: "15px",
      lineHeight: "1.6",
      color: "#1e293b",
      display: "flex",
      alignItems: "center",
    },
    
    label: {
      fontWeight: "700",
      color: "#334155",
      marginRight: "8px",
    },
    
    valueMono: {
      fontFamily: "'Roboto Mono', 'Menlo', monospace",
      fontSize: "14px",
      color: "#0f172a",
      letterSpacing: "0.5px",
    },

    valueText: {
      fontSize: "15px",
      color: "#0f172a",
      fontWeight: "500",
    },

    // Verified Badge
    badge: {
      backgroundColor: "#e0e7ff", 
      color: "#4338ca", 
      fontSize: "12px",
      fontWeight: "600",
      padding: "2px 10px",
      borderRadius: "999px",
      marginLeft: "12px",
      display: "inline-block",
    },

    // 按鈕群組
    btnGroup: {
      display: "flex",
      alignItems: "center",
      marginTop: "24px",
      gap: "12px",
    },

    // 圓角按鈕
    btnPill: {
      borderRadius: "999px",
      padding: "8px 20px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      border: "none",
      transition: "opacity 0.2s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },

    // 按鈕顏色
    btnWhite: {
      backgroundColor: "#ffffff",
      border: "1px solid #cbd5e1",
      color: "#0f172a",
    },
    btnGreen: {
      backgroundColor: "#5fdba7",
      color: "#064e3b",
      border: "none",
    },
    btnYellow: {
      backgroundColor: "#eab308",
      color: "#422006",
      border: "none",
    },
    btnRed: {
      backgroundColor: "#dc2626",
      color: "#ffffff",
      border: "none",
      marginLeft: "auto", // 將刪除按鈕推到最右邊
    },
    
    // Tab Button 樣式
    tabBtn: (isActive) => ({
      padding: "8px 24px",
      cursor: "pointer",
      fontSize: "15px",
      fontWeight: 600,
      borderRadius: "999px",
      border: "none",
      backgroundColor: isActive ? "#3b82f6" : "transparent",
      color: isActive ? "#ffffff" : "#64748b",
      transition: "all 0.2s",
      outline: "none",
    }),

    // Pending Offer 容器
    pendingContainer: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
  };

  return (
    <div style={{ padding: "40px 24px", maxWidth: "960px", margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      
      {/* 1. Pending Offers */}
      <section style={{ marginBottom: "50px" }}>
        {/* Header with Blue Bar - Align Left */}
        <div style={styles.headerRow}>
          <div style={styles.titleGroup}>
            <div style={styles.blueBar}></div>
            <h2 style={styles.sectionTitleText}>Pending Credential Offers</h2>
          </div>
          {/* Right side is empty for this section */}
          <div></div>
        </div>

        {loadingOffers ? <p>Loading...</p> : offers.length === 0 ? (
          <p style={{ color: "#94a3b8", marginLeft: "20px" }}>No offers pending.</p>
        ) : (
          <div>
            {offers.map((offer) => {
              const credExId = offer.credential_exchange_id || offer.id;
              const schemaId = offer.schema_id || "";
              const schemaParts = schemaId.split(':');
              const schemaName = schemaParts.length > 3 ? `${schemaParts[2]} v${schemaParts[3]}` : schemaId;
              //const issuerLabel = offer.issuerLabel || "Hospital";

              // 從 cred def / schema 推 issuer DID
              const credDefId =
                offer.credential_definition_id ||
                offer.cred_def_id ||
                ""; // 有時欄位名字不同

              let issuerDid = offer.issuerDid;
              if (!issuerDid && credDefId) issuerDid = credDefId.split(":")[0] || "";
              if (!issuerDid && schemaId) issuerDid = schemaId.split(":")[0] || "";

              // 用 DID_LABELS 對應出 Hospital / Insurer
              const issuerLabel =
                DID_LABELS[issuerDid] || offer.issuerLabel || issuerDid || "Unknown Issuer";


              return (
                <div key={credExId} style={styles.cardBase}>
                  <div style={styles.pendingContainer}>
                    {/* 左側資訊 */}
                    <div>
                      <div style={styles.infoRow}>
                        <span style={styles.label}>Schema:</span>
                        <span style={styles.valueText}>{schemaName}</span>
                      </div>
                      <div style={styles.infoRow}>
                        <span style={styles.label}>Issuer:</span>
                        <span style={styles.valueText}>{issuerLabel}</span>
                      </div>
                      <div style={{ fontSize: "13px", color: "#94a3b8", fontFamily: "monospace", marginTop: "4px" }}>
                        ID: {credExId}
                      </div>
                    </div>

                    {/* 右側按鈕 */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",           // ← 這個決定兩顆按鈕的距離
                      }}
                    >
                    <button
                      onClick={() => handleAccept(credExId)}
                      disabled={acceptingId === credExId}
                      style={{
                          ...styles.btnPill,
                          backgroundColor: acceptingId === credExId ? "#93c5fd" : "#2563eb",
                          color: "white",
                          boxShadow: "0 4px 10px rgba(37, 99, 235, 0.2)"
                      }}
                    >
                      {acceptingId === credExId ? "Accepting..." : "Accept"}
                    </button>

                    <button
                      onClick={() => handleReject(credExId)}
                      disabled={rejectingId === credExId}
                      style={{
                        ...styles.btnPill,
                        backgroundColor: "#ffffff",
                        border: "1px solid #fecaca",
                        color: "#b91c1c",
                      }}
                    >
                      {rejectingId === credExId ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. My Credentials (Tabbed) */}
      <section>
        {/* Header with Blue Bar (Left) and Tabs (Right) */}
        <div style={styles.headerRow}>
          <div style={styles.titleGroup}>
            <div style={styles.blueBar}></div>
            <h2 style={styles.sectionTitleText}>My Credentials</h2>
          </div>
          
          {/* Tabs positioned to the right */}
          <div style={styles.tabContainer}>
            <button onClick={() => setActiveTab("hospital")} style={styles.tabBtn(activeTab === "hospital")}>
              From Hospital
            </button>
            <button onClick={() => setActiveTab("insurer")} style={styles.tabBtn(activeTab === "insurer")}>
              From Insurer
            </button>
          </div>
        </div>

        {loadingCreds ? <p>Loading credentials...</p> : filteredCredentials.length === 0 ? (
           <div style={{...styles.cardBase, textAlign: "center", border: "2px dashed #cbd5e1", boxShadow: "none"}}>
             <p style={{color: "#94a3b8"}}>No credentials found in this category.</p>
           </div>
        ) : (
          <div>
            {filteredCredentials.map((cred) => (
              <div key={cred.id} style={styles.cardBase}>
                
                {/* 資訊區域 */}
                <div style={styles.infoRow}>
                  <span style={styles.label}>Credential ID:</span>
                  <span style={styles.valueMono}>{cred.id}</span>
                </div>
                
                <div style={styles.infoRow}>
                  <span style={styles.label}>Schema:</span>
                  <span style={styles.valueText}>{cred.schemaId}</span>
                </div>

                <div style={styles.infoRow}>
                  <span style={styles.label}>Issuer:</span>
                  <span style={styles.valueText}>{cred.issuerLabel || "Unknown"}</span>
                  {cred.issuerLabel && <span style={styles.badge}>verified</span>}
                </div>

                {/* 按鈕區域 (前三個靠左，Delete 靠右) */}
                <div style={styles.btnRow}>
                  {/* 左邊：Show + 試算 + 送出 */}
                  <div style={styles.leftActions}>
                    {/* Show attributes */}
                    <button
                      onClick={() => {
                        setExpandedId(expandedId === cred.id ? null : cred.id);
                        if (expandedId !== cred.id) setSelectingPreviewForId(null);
                      }}
                      style={styles.btnPill}
                    >
                      {expandedId === cred.id ? "Hide attributes" : "Show attributes"}
                    </button>

                 
                  {/* Hospital Only Buttons */}
                  {activeTab === "hospital" && (
                    <>
                      {/* 試算理賠 */}
                      <button
                        onClick={() => openPreviewSelector(cred)}
                        disabled={previewingId === cred.id}
                        style={{
                          ...styles.actionBtn,
                          backgroundColor: previewingId === cred.id ? "#bbf7d0" : "#22c55e",
                          color: "#064e3b",
                        }}
                      >
                         {previewingId === cred.id ? "計算中..." : "試算理賠"}
                      </button>

                      {/* 送出正式理賠申請 */}
                      <button
                        onClick={() => handleSubmitClaim(cred)}
                        disabled={submittingId === cred.id}
                        style={{
                          ...styles.actionBtn,
                          backgroundColor: submittingId === cred.id ? "#ca8a04" : "#eab308",
                          color: "#422006",
                        }}
                      >
                         {submittingId === cred.id ? "送出中..." : "送出理賠申請"}
                      </button>
                    </>
                  )}
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteCredential(cred.id)}
                    disabled={deletingId === cred.id}
                    style={{
                      ...styles.actionBtn,
                      marginLeft: "auto",          // 把 Delete 推到最右邊
                      backgroundColor: "#e11d48",
                      color: "white",
                      opacity: deletingId === cred.id ? 0.7 : 1,
                      cursor: deletingId === cred.id ? "not-allowed" : "pointer",
                    }}
                  >
                    {deletingId === cred.id ? "..." : "Delete"}
                  </button>
                </div>

                {/* --- 展開內容區域 (Attributes / Claim) --- */}
                
                {/* 屬性展示 */}
                {expandedId === cred.id && cred.attrs && (
                  <div
                    style={{
                      marginTop: "12px",
                      borderRadius: "12px",
                      background: "#f9fafb",
                      border: "1px solid #e2e8f0",
                      padding: "14px 16px",
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
                      Attributes
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
                      {Object.entries(cred.attrs).map(([key, value]) => (
                        <div key={key} style={{ display: "contents" }}>
                          <dt
                            style={{
                              justifySelf: "end",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#64748b",
                              textTransform: "none",
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
                      ))}
                    </dl>
                  </div>
                )}
                
                {/* 試算選擇 */}
                {activeTab === "hospital" && selectingPreviewForId === cred.id && (
                   <div
                    style={{
                      marginTop: "12px",
                      borderRadius: "12px",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      padding: "12px 14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#1d4ed8",
                        }}
                      >
                        選擇要揭露給保險公司的欄位
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAttrsByCredId((prev) => {
                              const next = { ...prev };
                              delete next[cred.id];
                              return next;
                            });
                          }}
                          style={{
                            border: "none",
                            background: "transparent",
                            fontSize: "11px",
                            color: "#2563eb",
                            cursor: "pointer",
                          }}
                        >
                          全選
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAttrsByCredId((prev) => ({
                              ...prev,
                              [cred.id]: new Set(),
                            }));
                          }}
                          style={{
                            border: "none",
                            background: "transparent",
                            fontSize: "11px",
                            color: "#64748b",
                            cursor: "pointer",
                          }}
                        >
                          全部取消
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        maxHeight: "180px",
                        overflowY: "auto",
                        paddingRight: "4px",
                        marginBottom: "10px",
                      }}
                    >
                      {Object.entries(getRawAttrsForCred(cred)).map(
                        ([key, value]) => {
                          const selectedSet =
                            selectedAttrsByCredId[cred.id];
                          const checked = selectedSet
                            ? selectedSet.has(key)
                            : true;

                          return (
                            <label
                              key={key}
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
                                  setSelectedAttrsByCredId((prev) => {
                                    let current = prev[cred.id];

                                    if (!current) {
                                      current = new Set(
                                        Object.keys(
                                          getRawAttrsForCred(cred) || {}
                                        )
                                      );
                                    } else {
                                      current = new Set(current);
                                    }

                                    if (isChecked) {
                                      current.add(key);
                                    } else {
                                      current.delete(key);
                                    }

                                    return {
                                      ...prev,
                                      [cred.id]: current,
                                    };
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
                                  color: "#1f2937",
                                  minWidth: "120px",
                                  textAlign: "right",
                                }}
                              >
                                {key}
                              </span>
                              <span
                                style={{
                                  flex: 1,
                                  color: "#0f172a",
                                  wordBreak: "break-word",
                                }}
                              >
                                {value}
                              </span>
                            </label>
                          );
                        }
                      )}
                    </div>

                    {/* 保單選擇（用保險公司發出的 VC） */}
                    <div
                      style={{
                        marginBottom: "10px",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        backgroundColor: "#eef2ff",
                        border: "1px solid #c7d2fe",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#3730a3",
                          whiteSpace: "nowrap",
                        }}
                      >
                        套用的保單：
                      </span>

                      <select
                        value={policySelectionByCredId[cred.id] || ""}
                        onChange={(e) => {
                          const value = e.target.value || null;
                          setPolicySelectionByCredId((prev) => ({
                            ...prev,
                            [cred.id]: value,
                          }));
                        }}
                        style={{
                          flex: 1,
                          fontSize: "12px",
                          padding: "6px 8px",
                          borderRadius: "999px",
                          border: "1px solid #c7d2fe",
                          outline: "none",
                        }}
                      >
                        <option value="">
                          （不套用保單，只做示意試算）
                        </option>
                        {insurerCredentials.map((policyCred) => {
                          const attrs = getRawAttrsForCred(policyCred);
                          const policyName =
                            attrs.product_name ||
                            attrs.coverage_type ||
                            policyCred.schemaId ||
                            policyCred.id;
                          return (
                            <option key={policyCred.id} value={policyCred.id}>
                              {policyName}（ID: {policyCred.id.slice(0, 6)}...）
                            </option>
                          );
                        })}
                      </select>
                    </div>



                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "8px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectingPreviewForId(null)}
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
                        onClick={() => handlePreviewClaim(cred)}
                        disabled={previewingId === cred.id}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "999px",
                          border: "none",
                          backgroundColor:
                            previewingId === cred.id
                              ? "#bfdbfe"
                              : "#2563eb",
                          color: "white",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor:
                            previewingId === cred.id
                              ? "wait"
                              : "pointer",
                        }}
                      >
                        {previewingId === cred.id ? "計算中..." : "確定試算"}
                      </button>
                    </div>
                  </div>
                )}


                {/* 試算結果 */}
                {activeTab === "hospital" &&
                  claimPreviewByCredId[cred.id] &&
                  (() => {
                    const selectedPolicyId = policySelectionByCredId[cred.id];
                    const selectedPolicyCred = selectedPolicyId
                      ? credentials.find((c) => c.id === selectedPolicyId)
                      : null;
                    const selectedPolicyAttrs = selectedPolicyCred
                      ? getRawAttrsForCred(selectedPolicyCred)
                      : null;
                    const selectedPolicyName =
                      selectedPolicyAttrs?.product_name ||
                      selectedPolicyAttrs?.coverage_type ||
                      (selectedPolicyCred && selectedPolicyCred.schemaId);

                    return (
                      <div
                        style={{
                          marginTop: "12px",
                          borderRadius: "12px",
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          padding: "14px 16px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            marginBottom: "8px",
                            color: "#166534",
                          }}
                        >
                          預估理賠結果
                        </div>

                        {/* 顯示這次是用哪張保單算的 */}
                        {selectedPolicyCred && (
                          <p
                            style={{
                              margin: "0 0 8px",
                              fontSize: "12px",
                              color: "#15803d",
                            }}
                          >
                            本次試算使用保單：
                            <strong>{selectedPolicyName || "未命名保單"}</strong>
                            （ID: {selectedPolicyCred.id.slice(0, 8)}...）
                          </p>
                        )}

                        <p
                          style={{
                            margin: 0,
                            fontSize: "13px",
                            color: "#14532d",
                          }}
                        >
                          可否理賠：
                          {claimPreviewByCredId[cred.id].eligible ? "可以" : "不可以"}
                        </p>
                        <p
                          style={{
                            margin: "4px 0 8px",
                            fontSize: "13px",
                            color: "#14532d",
                          }}
                        >
                          預估金額：
                          {claimPreviewByCredId[cred.id].totalPayout} 元
                        </p>
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: "18px",
                            fontSize: "12px",
                            color: "#166534",
                          }}
                        >
                          {claimPreviewByCredId[cred.id].breakdown.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}


                {/* 送出結果 */}
                {activeTab === "hospital" && submittedClaimByCredId[cred.id] && (
                   <div
                      style={{
                        marginTop: "10px",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: "1px solid #fee2e2",
                        backgroundColor: "#fef2f2",
                        fontSize: "12px",
                        color: "#7f1d1d",
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                        已送出理賠申請
                      </div>
                      <div>
                        Claim ID：
                        {submittedClaimByCredId[cred.id].claimId}（狀態：
                        {submittedClaimByCredId[cred.id].status}）
                      </div>
                    </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}