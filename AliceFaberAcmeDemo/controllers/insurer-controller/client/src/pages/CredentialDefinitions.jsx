import { useState, useEffect } from "react";

export default function CredentialDefinitionsPage() {
  const [definitions, setDefinitions] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [definitionData, setDefinitionData] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 初次載入：抓所有 Credential Definition IDs
  useEffect(() => {
    async function fetchDefinitions() {
      try {
        const res = await fetch("/api/credentialDefinitions");
        const data = await res.json();
        if (data.ok) {
          // 根據你的後端回傳 key 改名
          setDefinitions(data.credentialDefinitionIds || []);
        } else {
          throw new Error(data.error || "Load failed");
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDefinitions();
  }, []);

  // 選擇 definition → 抓詳細資料
  const handleSelect = async (e) => {
    const id = e.target.value;
    setSelectedId(id);
    if (!id) return;

    try {
      const res = await fetch(`/api/credentialDefinitions/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.ok) {
        setDefinitionData(JSON.stringify(data.result, null, 2));
      } else {
        throw new Error(data.error || "Failed to load definition");
      }
    } catch (err) {
      console.error(err);
      setDefinitionData(`❌ ${err.message}`);
    }
  };

  if (loading) return <p style={{ color: "#666" }}>Loading credential definitions...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

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
      {/* 標題 */}
      <h2
        style={{
          color: "#003366",
          borderBottom: "3px solid #cce0ff",
          paddingBottom: "8px",
          marginTop: "3px",
          marginBottom: "20px",
          fontWeight: 600,
        }}
      > Credential Definitions</h2>

      {/* 下拉選單區塊 */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "16px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          marginBottom: "20px",
        }}
      >
        <label htmlFor="defSelect"
        style={{
            fontWeight: 500,
            color: "#003366",
            fontSize: "19px",
            display: "block",
            marginBottom: "8px",
          }}>
            Select a Credential Definition:
        </label>
        <select
          id="defSelect"
          className="form-control"
          value={selectedId}
          onChange={handleSelect}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "8px",
            borderRadius: "6px",
            border: "1px solid #ccd9ff",
            outline: "none",
            fontSize: "15px",
          }}
        >
          <option value="">-- Select a Credential Definition --</option>
          {definitions.map((defId) => (
            <option key={defId} value={defId}>
              {defId}
            </option>
          ))}
        </select>
      </div>

      {/* 顯示 Definition 詳細資料 */}
      {definitionData && (
        <div
          style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h4 style={{ color: "#003366", marginBottom: "10px" }}>Definition Detail</h4>
          <pre
            style={{
              background: "#f5f7fa",
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              overflowY: "auto",
              maxHeight: "400px",
              fontSize: "14px",
              lineHeight: 1.5,
              color: "#222",
            }}
          >
            {definitionData}
          </pre>
        </div>
      )}
    </div>
  );
}
