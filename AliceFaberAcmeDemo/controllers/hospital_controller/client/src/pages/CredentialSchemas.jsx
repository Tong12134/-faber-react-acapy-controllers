import { useEffect, useState } from "react";

export default function CredentialSchemasPage() {
  const [schemas, setSchemas] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [schemaData, setSchemaData] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  //  初始化 — 抓取所有 schema IDs
  useEffect(() => {
    async function fetchSchemas() {
      try {
        const res = await fetch("/api/credentialSchemas");
        const data = await res.json();
        if (data.ok) {
          setSchemas(data.schemaIds || []);
        } else {
          throw new Error(data.error || "Failed to load schemas");
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSchemas();
  }, []);

  // 🔹 當使用者選擇一個 schema 時
  const handleSelect = async (e) => {
    const id = e.target.value;
    setSelectedId(id);
    if (!id) return;
    try {
      const res = await fetch(`/api/credentialSchemas/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.ok) {
        setSchemaData(JSON.stringify(data.result, null, 2));
      } else {
        throw new Error(data.error || "Failed to load schema detail");
      }
    } catch (err) {
      console.error(err);
      setSchemaData(`❌ ${err.message}`);
    }
  };

  if (loading) return <p>Loading schemas...</p>;
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
      {/* ✅ 頁面標題 */}
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
         Credential Schemas
      </h2>

      {/* ✅ 下拉選單卡片 */}
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
          htmlFor="schemaSelect"
          style={{
            fontWeight: 500,
            color: "#003366",
            fontSize: "19px",
            display: "block",
            marginBottom: "8px",
          }}
        >
          Select a Schema:
        </label>

        <select
          id="schemaSelect"
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
          <option value="">-- Select a Schema --</option>
          {schemas.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* ✅ Schema Detail 區塊 */}
      {schemaData && (
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
            Schema Detail
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
            {schemaData}
          </pre>
        </div>
      )}
    </div>
  );
}
