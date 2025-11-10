import { useState, useEffect } from "react";

export default function CredentialDefinitionsPage() {
  const [definitions, setDefinitions] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [definitionData, setDefinitionData] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 初次載入：抓所有 definition IDs
  useEffect(() => {
    async function fetchDefinitions() {
      try {
        const res = await fetch("/api/credentialDefinitions");
        const data = await res.json();
        if (data.ok) {
          setDefinitions(data.defIds || []);
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
    console.log("Selected definition ID:", id);
    setSelectedId(id);
    if (!id) return;
    try {
        // encodeURIComponent 避免冒號出錯
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

  if (loading) return <p>Loading definitions...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div className="container" style={{ maxWidth: "800px", padding: "20px" }}>
      <h2>Credential Definitions</h2>

      <select
        className="form-control mb-3"
        value={selectedId}
        onChange={handleSelect}
      >
        <option value="">Select a Credential Definition</option>
        {definitions.map((defId) => (
          <option key={defId} value={defId}>
            {defId}
          </option>
        ))}
      </select>

      {definitionData && (
        <div style={{ background: "#f5f5f5", padding: "10px", borderRadius: "6px" }}>
          <h4>Definition Detail</h4>
          <pre
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              background: "#fff",
              border: "1px solid #ddd",
              padding: "10px",
            }}
          >
            {definitionData}
          </pre>
        </div>
      )}
    </div>
  );
}
