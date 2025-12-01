import { useEffect, useState } from "react";

export default function CredentialDefinitionsPage() {
  const [definitions, setDefinitions] = useState([]);   // defIds
  const [selectedId, setSelectedId] = useState("");
  const [defData, setDefData] = useState("");           // 顯示在 <pre> 裡的字串
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 初始化 — 抓取所有 credential definition IDs
  useEffect(() => {
    async function fetchDefinitions() {
      try {
        // 對應後端：GET /api/credentialDefinitions  ->  { ok, defIds: [...] }
        const res = await fetch("/api/credentialDefinitions");
        const data = await res.json();
        if (data.ok) {
          setDefinitions(data.defIds || []);
        } else {
          throw new Error(data.error || "Failed to load credential definitions");
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

  // 當使用者選擇一個 definition 時
  const handleSelect = async (e) => {
    const id = e.target.value;
    setSelectedId(id);
    setDefData("");

    if (!id) return;

    try {
      // 對應後端：GET /api/credentialDefinitions/:id  -> { ok, result: {...} }
      const res = await fetch(
        `/api/credentialDefinitions/${encodeURIComponent(id)}`
      );
      const data = await res.json();
      if (data.ok) {
        setDefData(JSON.stringify(data.result, null, 2));
      } else {
        throw new Error(data.error || "Failed to load definition detail");
      }
    } catch (err) {
      console.error(err);
      setDefData(`❌ ${err.message}`);
    }
  };

  if (loading) return <p>Loading credential definitions...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div
      style={{
        backgroundColor: "#f8faff", // 柔藍背景
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        minHeight: "70vh",
      }}
    >
      {/* 頁面標題 */}
      <h2
        style={{
          color: "#003366",
          borderBottom: "3px solid #cce0ff",
          paddingBottom: "8px",
          marginTop: "3px",
          marginBottom: "20px",
          fontWeight: 600,
        }}
      >
        Credential Definitions
      </h2>

      {/* 下拉選單卡片 */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "10px",
          padding: "20px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          marginBottom: "20px",
        }}
      >
        <label
          htmlFor="definitionSelect"
          style={{
            fontWeight: 500,
            color: "#003366",
            fontSize: "19px",
            display: "block",
            marginBottom: "8px",
          }}
        >
          Select a Credential Definition:
        </label>

        <select
          id="definitionSelect"
          value={selectedId}
          onChange={handleSelect}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccd9ff",
            fontSize: "15px",
            outline: "none",
            transition: "border-color 0.2s ease",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#99bbff")}
          onBlur={(e) => (e.target.style.borderColor = "#ccd9ff")}
        >
          <option value="">-- Select a Credential Definition --</option>
          {definitions.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      {/* Definition Detail 區塊 */}
      {defData && (
        <div
          style={{
            background: "#fff",
            borderRadius: "10px",
            padding: "20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <h4
            style={{
              color: "#003366",
              marginBottom: "10px",
              borderBottom: "2px solid #e0ebff",
              paddingBottom: "4px",
            }}
          >
            Definition Detail
          </h4>
          <pre
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              background: "#f9faff",
              border: "1px solid #ccd9ff",
              borderRadius: "6px",
              padding: "12px",
              fontFamily: "monospace",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            {defData}
          </pre>
        </div>
      )}
    </div>
  );
}
