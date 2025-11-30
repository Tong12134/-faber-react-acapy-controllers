import { useState, useEffect } from "react";

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loadingCreds, setLoadingCreds] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);   

  // DID → 顯示名稱
  const DID_LABELS = {
    QWTxizRo9A1tWdEPYkFPHe: "Hospital",
    // SOMEOTHERDID: "Insurer",
  };

  // 取得已儲存的 credentials
  const fetchCredentials = async () => {
    setLoadingCreds(true);
    try {
      const res = await fetch("/api/credentials");
      const data = await res.json();
      if (data.ok) {
        setCredentials(data.credentials || []);
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

    // 從前端 state 中移除這張
    setCredentials((prev) => (prev || []).filter((c) => c.id !== credId));

    // 如果剛好有打開詳細欄位，順便收起來
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


  // 按「Accept」
  // 後端會呼叫 /issue-credential/records/{id}/send-request (auto_store_credential)
  const handleAccept = async (offerId) => {
    if (!offerId) return;

    // 接受前記住現在 My Credentials 的數量
    const prevCount = credentials.length;
    setAcceptingId(offerId);

    try {
      // 1) 對後端發 Accept
      const res = await fetch(`/api/credentialOffers/${offerId}/accept`, {
        method: "POST",
      });
      const data = await res.json();

      if (!data.ok) {
        alert("❌ Failed to accept credential offer: " + data.error);
        return;
      }

      // 2) 輪詢 /api/credentials，直到看到新憑證或超過次數
      let tries = 0;
      let stored = false;

      while (tries < 8 && !stored) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const checkRes = await fetch("/api/credentials");
        const checkData = await checkRes.json();

        if (checkData.ok) {
          const list = checkData.credentials || checkData.results || [];
          if (list.length > prevCount) {
            setCredentials(list);
            stored = true;
          }
        }
        tries += 1;
      }

      // 3) 更新 Pending Offers（收到的那筆會自動消失）
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

  // 樣式
  const sectionTitleStyle = {
    color: "#003366",
    borderLeft: "4px solid #4c8dff",
    paddingLeft: "10px",
    marginBottom: "12px",
    fontWeight: 650,
    fontSize: "22px",
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

              // schemaId: issuer:schemaName:version → 抓中間 + 版本
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
        ) : credentials.length === 0 ? (
          <p style={{ color: "#64748b" }}>No credentials found.</p>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {credentials.map((cred) => (
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
                  <span>{cred.issuerLabel || cred.issuerDid || "Unknown"}</span>
                  {cred.issuerLabel && <span style={smallBadge}>verified</span>}
                </p>

                <div
                  style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: "8px",
                }}
                >
                  {/* 左邊：Show / Hide attributes */}
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === cred.id ? null : cred.id)
                    }
                    style={{
                      padding: "6px 12px",
                      borderRadius: "999px",
                      border: "1px solid #cbd5f5",
                      backgroundColor: "#f8fafc",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    {expandedId === cred.id ? "Hide attributes" : "Show attributes"}
                  </button>

                  {/* 中間塞一個彈性的空白，把右邊的 Delete 擠到最右 */}
                  <div style={{ flex: 1 }} />

                  {/* 右邊：Delete */}
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
                      cursor: deletingId === cred.id ? "not-allowed" : "pointer",
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
        )}
      </section>
    </div>
  );
}
