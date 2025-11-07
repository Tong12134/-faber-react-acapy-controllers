import { useEffect, useState } from "react";

export default function CredentialSchemasPage() {
  const [schemas, setSchemas] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [schemaData, setSchemaData] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔹 初始化 — 抓取所有 schema IDs
  useEffect(() => {
    async function fetchSchemas() {
      try {
        const res = await fetch("/api/schemas");
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
      const res = await fetch(`/api/schemas/${encodeURIComponent(id)}`);
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
    <div className="container" style={{ maxWidth: "800px", padding: "20px" }}>
      <h2>Credential Schemas</h2>

      <select
        className="form-control mb-3"
        value={selectedId}
        onChange={handleSelect}
      >
        <option value="">Select a Schema</option>
        {schemas.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {schemaData && (
        <div
          style={{
            background: "#f5f5f5",
            borderRadius: "8px",
            padding: "10px",
          }}
        >
          <h4>Schema Detail</h4>
          <pre
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              background: "#fff",
              border: "1px solid #ddd",
              padding: "10px",
            }}
          >
            {schemaData}
          </pre>
        </div>
      )}
    </div>
  );
}
