import { useState, useEffect } from "react";

// DID → 顯示名稱
const HOSPITAL_DID = "QWTxizRo9A1tWdEPYkFPHe";
const INSURER_DID = "HZnimaMX5B9zwh13thnNLG";

const DID_LABELS = {
  [HOSPITAL_DID]: "Hospital",
  [INSURER_DID]: "Insurer",
};

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loadingCreds, setLoadingCreds] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [previewingId, setPreviewingId] = useState(null); // 哪一張 credential 正在試算
  const [claimPreviewByCredId, setClaimPreviewByCredId] = useState({}); // { [credId]: previewResult }
  const [submittingId, setSubmittingId] = useState(null);
  const [submittedClaimByCredId, setSubmittedClaimByCredId] = useState({});
  const [selectedAttrsByCredId, setSelectedAttrsByCredId] = useState({});
  const [selectingPreviewForId, setSelectingPreviewForId] = useState(null);

  const INSURER_API_BASE = "http://localhost:5070";

  // 假資料，或之後從登入狀態拿
  const DEMO_INSURED_ID = "patient-001";
  const DEMO_POLICY_ID = "POLICY-DEMO-001";

  // Hosptial demo attrs
  const mockCredentialAttrs = {
    hospital_id: "HOSPITAL-001",
    encounter_id: "E2025-0001",
    encounter_class: "INPATIENT",
    encounter_department: "Orthopedics",
    encounter_date: "2025-06-01",
    admission_date: "2025-06-01",
    discharge_date: "2025-06-05",
    diagnosis_system: "ICD-10",
    diagnosis_code: "S7200",
    diagnosis_display: "Femur fracture",
    procedure_code: "FEMUR-ORIF",
    procedure_display: "Open reduction internal fixation",
    provider_org_name: "Good Hospital",
    provider_org_id: "HOSPITAL-001",
    record_type: "encounter",
    timestamp: "2025-06-06T10:00:00+08:00",
  };

  // 原始 attrs（優先用 credential 真的 attr，沒有就用 mock）
  const getRawAttrsForCred = (cred) =>
    cred.attrs && Object.keys(cred.attrs).length > 0
      ? cred.attrs
      : mockCredentialAttrs;

  // 把從 API 回來的 credentials 裝飾一下：補 issuerDid / issuerLabel（確保可讀）
  const decorateCredentials = (rawList = []) =>
    (rawList || []).map((c) => {
      const credDefId =
        c.credential_definition_id || c.cred_def_id || c.credDefId || "";
      const schemaId = c.schema_id || c.schemaId || "";

      let issuerDid = c.issuerDid;
      if (!issuerDid && credDefId) {
        issuerDid = credDefId.split(":")[0] || "";
      }
      if (!issuerDid && schemaId) {
        issuerDid = schemaId.split(":")[0] || "";
      }

      const issuerLabel =
        DID_LABELS[issuerDid] || c.issuerLabel || issuerDid || "Unknown Issuer";

      return {
        ...c,
        issuerDid,
        issuerLabel,
      };
    });

  // 取得已儲存的 credentials
  const fetchCredentials = async () => {
    setLoadingCreds(true);
    try {
      const res = await fetch("/api/credentials");
      const data = await res.json();
      if (data.ok) {
        const list = decorateCredentials(data.credentials || []);
        setCredentials(list);
      } else {
        console.error("Failed to load credentials:", data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCreds(false);
    }
  };

  // 取得待接受 offers
  const fetchOffers = async () => {
    setLoadingOffers(true);
    try {
      const res = await fetch("/api/credentialOffers");
      const data = await res.json();
      if (data.ok) {
        setOffers(data.offers || []);
      } else {
        console.error("Failed to load offers:", data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOffers(false);
    }
  };

  const handleDeleteCredential = async (credId) => {
    if (!credId) return;

    const ok = window.confirm("確定要刪除這張 Credential 嗎？");
    if (!ok) return;

    setDeletingId(credId);
    try {
      const res = await fetch(`/api/credentials/${credId}/remove`, {
        method: "POST",
      });
      const data = await res.json();

      if (!data.ok) {
        alert("❌ 刪除失敗：" + data.error);
        return;
      }

      setCredentials((prev) => (prev || []).filter((c) => c.id !== credId));
      if (expandedId === credId) {
        setExpandedId(null);
      }
    } catch (err) {
      console.error(err);
      alert("❌ 刪除時發生錯誤：" + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // 統一計算「這張 credential 最後要送出去的 attrs」
  const getSelectedAttrsForCred = (cred) => {
    const rawAttrs = getRawAttrsForCred(cred);
    const selectedKeys = selectedAttrsByCredId[cred.id];

    if (!selectedKeys || selectedKeys.size === 0) {
      return rawAttrs;
    }

    const subset = {};
    for (const [key, value] of Object.entries(rawAttrs)) {
      if (selectedKeys.has(key)) {
        subset[key] = value;
      }
    }
    if (Object.keys(subset).length === 0) {
      return rawAttrs;
    }
    return subset;
  };

  const handlePreviewClaim = async (cred) => {
    const credId = cred.id;
    if (!credId) return;

    setPreviewingId(credId);
    const attrs = getSelectedAttrsForCred(cred);

    try {
      const res = await fetch(
        "http://localhost:5070/api/claim/preview-from-hospital-credential",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            credentialAttrs: attrs,
          }),
        }
      );

      const data = await res.json();
      if (!data.ok) {
        alert("❌ 試算失敗：" + (data.error || "unknown error"));
        return;
      }

      setClaimPreviewByCredId((prev) => ({
        ...prev,
        [credId]: data.preview,
      }));
    } catch (err) {
      console.error(err);
      alert("❌ 呼叫理賠試算 API 失敗：" + err.message);
    } finally {
      setPreviewingId(null);
    }
  };

  const openPreviewSelector = (cred) => {
    const credId = cred.id;
    if (!credId) return;

    if (selectingPreviewForId === credId) {
      setSelectingPreviewForId(null);
      return;
    }

    setSelectingPreviewForId(credId);

    // 打開理賠試算欄位選擇時關掉 attributes
    if (expandedId === credId) {
      setExpandedId(null);
    }

    setSelectedAttrsByCredId((prev) => {
      if (prev[credId]) return prev;
      const rawAttrs = getRawAttrsForCred(cred);
      const allKeys = Object.keys(rawAttrs || {});
      return {
        ...prev,
        [credId]: new Set(allKeys),
      };
    });
  };

  const handleSubmitClaim = async (cred) => {
    const credId = cred.id;
    if (!credId) return;

    setSubmittingId(credId);
    const attrs = getSelectedAttrsForCred(cred);

    try {
      const res = await fetch(`${INSURER_API_BASE}/api/claim/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialAttrs: attrs,
          insuredId: DEMO_INSURED_ID,
          policyId: DEMO_POLICY_ID,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        alert("❌ 送出理賠申請失敗：" + (data.error || "unknown error"));
        return;
      }

      setSubmittedClaimByCredId((prev) => ({
        ...prev,
        [credId]: data.claim,
      }));
    } catch (err) {
      console.error(err);
      alert("❌ 呼叫 /api/claim/submit 失敗：" + err.message);
    } finally {
      setSubmittingId(null);
      setSelectingPreviewForId(null);
    }
  };

  // 按「Accept」
  const handleAccept = async (offerId) => {
    if (!offerId) return;

    const prevCount = credentials.length;
    setAcceptingId(offerId);

    try {
      const res = await fetch(`/api/credentialOffers/${offerId}/accept`, {
        method: "POST",
      });
      const data = await res.json();

      if (!data.ok) {
        alert("❌ Failed to accept credential offer: " + data.error);
        return;
      }

      let tries = 0;
      let stored = false;

      while (tries < 8 && !stored) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const checkRes = await fetch("/api/credentials");
        const checkData = await checkRes.json();

        if (checkData.ok) {
          const rawList = checkData.credentials || checkData.results || [];
          const list = decorateCredentials(rawList);
          if (list.length > prevCount) {
            setCredentials(list);
            stored = true;
          }
        }
        tries += 1;
      }

      await fetchOffers();
    } catch (err) {
      console.error(err);
      alert("❌ Error while accepting offer: " + err.message);
    } finally {
      setAcceptingId(null);
    }
  };

  useEffect(() => {
    fetchCredentials();
    fetchOffers();
  }, []);

  // 先到的在上面（反轉）
  const sortedCredentials = [...(credentials || [])].reverse();

  // ⭐ 新增：依 issuer 分兩組
  const hospitalCreds = sortedCredentials.filter(
    (c) => c.issuerDid === HOSPITAL_DID || c.issuerLabel === "Hospital"
  );
  const insurerCreds = sortedCredentials.filter(
    (c) => c.issuerDid === INSURER_DID || c.issuerLabel === "Insurer"
  );

  // 樣式
  const sectionTitleStyle = {
    color: "#003366",
    borderLeft: "4px solid #4c8dff",
    paddingLeft: "10px",
    marginBottom: "12px",
    fontWeight: 650,
    fontSize: "22px",
  };

  const subSectionTitleStyle = {
    fontSize: "18px",
    fontWeight: 600,
    color: "#1e3a8a",
    marginTop: "4px",
    marginBottom: "8px",
  };

  const cardStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    padding: "16px 20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    border: "1px solid #e3ebff",
  };

  const labelStyle = {
    fontWeight: 600,
    color: "#334155",
    marginRight: 6,
  };

  const smallBadge = {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "12px",
    backgroundColor: "#e0e7ff",
    color: "#1e3a8a",
    marginLeft: "8px",
  };

  return (
    <div
      style={{
        padding: "24px 16px",
        maxWidth: "980px",
        margin: "0 auto 40px",
      }}
    >
      {/* Pending Offers 區塊 */}
      <section style={{ marginBottom: "40px" }}>
        <h2 style={sectionTitleStyle}>Pending Credential Offers</h2>

        {loadingOffers ? (
          <p>Loading offers...</p>
        ) : offers.length === 0 ? (
          <p style={{ color: "#64748b" }}>No pending credential offers.</p>
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            {offers.map((offer) => {
              const credExId =
                offer.credential_exchange_id || offer.id || offer._id;
              const schemaId = offer.schema_id || offer.schemaId || "";
              const credDefId =
                offer.credential_definition_id ||
                offer.cred_def_id ||
                offer.credential_definition_id;

              const issuerDid = (credDefId || "").split(":")[0] || "";
              const issuerLabel =
                offer.issuerLabel ||
                DID_LABELS[issuerDid] ||
                issuerDid ||
                "Unknown Issuer";

              let schemaShort = schemaId;
              const parts = schemaId.split(":");
              if (parts.length >= 4) {
                schemaShort = `${parts[2]} v${parts[3]}`;
              }

              return (
                <div key={credExId} style={cardStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "15px", marginBottom: "4px" }}>
                        <span style={labelStyle}>Schema:</span>
                        <span>{schemaShort}</span>
                      </div>
                      <div style={{ fontSize: "14px", color: "#475569" }}>
                        <span style={labelStyle}>Issuer:</span>
                        <span>{issuerLabel}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAccept(credExId)}
                      disabled={acceptingId === credExId}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "999px",
                        border: "none",
                        fontWeight: 600,
                        fontSize: "14px",
                        cursor: "pointer",
                        background:
                          acceptingId === credExId ? "#cbd5f5" : "#2563eb",
                        color: "white",
                        boxShadow: "0 2px 6px rgba(37, 99, 235, 0.35)",
                      }}
                    >
                      {acceptingId === credExId ? "Accepting..." : "Accept"}
                    </button>
                  </div>
                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "12px",
                      color: "#94a3b8",
                    }}
                  >
                    ID: {credExId}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* My Credentials 區塊 */}
      <section>
        <h2 style={sectionTitleStyle}>My Credentials</h2>

        {loadingCreds ? (
          <p>Loading credentials...</p>
        ) : sortedCredentials.length === 0 ? (
          <p style={{ color: "#64748b" }}>No credentials found.</p>
        ) : (
          <>
            {/* ⭐ Hospital 的憑證：有理賠試算／送出理賠 */}
            {hospitalCreds.length > 0 && (
              <>
                <h3 style={subSectionTitleStyle}>From Hospital</h3>
                <div
                  style={{
                    display: "grid",
                    gap: "16px",
                    marginBottom: "24px",
                  }}
                >
                  {hospitalCreds.map((cred) => (
                    <div key={cred.id} style={cardStyle}>
                      <p style={{ marginBottom: "6px", fontSize: "15px" }}>
                        <span style={labelStyle}>Credential ID:</span>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "13px",
                            wordBreak: "break-all",
                          }}
                        >
                          {cred.id}
                        </span>
                      </p>

                      <p style={{ marginBottom: "4px", fontSize: "14px" }}>
                        <span style={labelStyle}>Schema:</span>
                        <span>{cred.schemaId}</span>
                      </p>

                      <p style={{ marginBottom: "8px", fontSize: "14px" }}>
                        <span style={labelStyle}>Issuer:</span>
                        <span>
                          {cred.issuerLabel || cred.issuerDid || "Unknown"}
                        </span>
                        {cred.issuerLabel && (
                          <span style={smallBadge}>verified</span>
                        )}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginTop: "8px",
                        }}
                      >
                        {/* Show attributes */}
                        <button
                          onClick={() => {
                            if (expandedId === cred.id) {
                              setExpandedId(null);
                            } else {
                              setExpandedId(cred.id);
                              if (selectingPreviewForId === cred.id) {
                                setSelectingPreviewForId(null);
                              }
                            }
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "999px",
                            border: "1px solid #cbd5f5",
                            backgroundColor: "#f8fafc",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          {expandedId === cred.id
                            ? "Hide attributes"
                            : "Show attributes"}
                        </button>

                        {/* 試算理賠 */}
                        <button
                          onClick={() => openPreviewSelector(cred)}
                          disabled={previewingId === cred.id}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "999px",
                            border: "1px solid #bbf7d0",
                            backgroundColor:
                              previewingId === cred.id
                                ? "#dcfce7"
                                : "#22c55e",
                            color: "#064e3b",
                            fontSize: "13px",
                            fontWeight: 600,
                            marginLeft: "15px",
                            cursor:
                              previewingId === cred.id ? "wait" : "pointer",
                          }}
                        >
                          {previewingId === cred.id ? "計算中..." : "試算理賠"}
                        </button>

                        {/* 送出正式理賠申請 */}
                        <button
                          onClick={() => handleSubmitClaim(cred)}
                          disabled={submittingId === cred.id}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "999px",
                            border: "1px solid #facc15",
                            backgroundColor:
                              submittingId === cred.id ? "#fef9c3" : "#eab308",
                            color: "#422006",
                            fontSize: "13px",
                            fontWeight: 600,
                            marginLeft: "15px",
                            cursor:
                              submittingId === cred.id ? "wait" : "pointer",
                          }}
                        >
                          {submittingId === cred.id
                            ? "送出中..."
                            : "送出理賠申請"}
                        </button>

                        <div style={{ flex: 1 }} />

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteCredential(cred.id)}
                          disabled={deletingId === cred.id}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "999px",
                            border: "none",
                            backgroundColor: "#e11d48",
                            color: "white",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor:
                              deletingId === cred.id
                                ? "not-allowed"
                                : "pointer",
                            opacity: deletingId === cred.id ? 0.7 : 1,
                          }}
                        >
                          {deletingId === cred.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>

                      {/* Attributes */}
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

                      {/* 理賠試算欄位選擇 */}
                      {selectingPreviewForId === cred.id && (
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

                      {/* 預估理賠結果 */}
                      {claimPreviewByCredId[cred.id] && (
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
                          <p
                            style={{
                              margin: 0,
                              fontSize: "13px",
                              color: "#14532d",
                            }}
                          >
                            可否理賠：
                            {claimPreviewByCredId[cred.id].eligible
                              ? "可以"
                              : "不可以"}
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
                            {claimPreviewByCredId[cred.id].breakdown.map(
                              (r, idx) => (
                                <li key={idx}>{r}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                      {submittedClaimByCredId[cred.id] && (
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
              </>
            )}

            {/* ⭐ Insurer 的憑證：只保留 Show attributes（＋ Delete） */}
            {insurerCreds.length > 0 && (
              <>
                <h3 style={subSectionTitleStyle}>From Insurer</h3>
                <div style={{ display: "grid", gap: "16px" }}>
                  {insurerCreds.map((cred) => (
                    <div key={cred.id} style={cardStyle}>
                      <p style={{ marginBottom: "6px", fontSize: "15px" }}>
                        <span style={labelStyle}>Credential ID:</span>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "13px",
                            wordBreak: "break-all",
                          }}
                        >
                          {cred.id}
                        </span>
                      </p>

                      <p style={{ marginBottom: "4px", fontSize: "14px" }}>
                        <span style={labelStyle}>Schema:</span>
                        <span>{cred.schemaId}</span>
                      </p>

                      <p style={{ marginBottom: "8px", fontSize: "14px" }}>
                        <span style={labelStyle}>Issuer:</span>
                        <span>
                          {cred.issuerLabel || cred.issuerDid || "Unknown"}
                        </span>
                        {cred.issuerLabel && (
                          <span style={smallBadge}>verified</span>
                        )}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginTop: "8px",
                        }}
                      >
                        {/* 只有 Show attributes */}
                        <button
                          onClick={() => {
                            setExpandedId(
                              expandedId === cred.id ? null : cred.id
                            );
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "999px",
                            border: "1px solid #cbd5f5",
                            backgroundColor: "#f8fafc",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          {expandedId === cred.id
                            ? "Hide attributes"
                            : "Show attributes"}
                        </button>

                        <div style={{ flex: 1 }} />

                        {/* Delete 一樣保留（如果不想要也可以之後拿掉） */}
                        <button
                          onClick={() => handleDeleteCredential(cred.id)}
                          disabled={deletingId === cred.id}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "999px",
                            border: "none",
                            backgroundColor: "#e11d48",
                            color: "white",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor:
                              deletingId === cred.id
                                ? "not-allowed"
                                : "pointer",
                            opacity: deletingId === cred.id ? 0.7 : 1,
                          }}
                        >
                          {deletingId === cred.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>

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
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
