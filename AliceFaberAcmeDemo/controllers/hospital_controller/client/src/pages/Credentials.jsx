// client/src/pages/CredentialsPage.jsx
import { useState, useEffect } from "react";

export default function CredentialsPage() {
  const [form, setForm] = useState({
    ConnectionId: "",
    SchemaId: "",
    CredentialDefinitionId: "",
    CredentialAttributesObject: JSON.stringify(
      [
        { name: "name", value: "Alice Smith" },
        { name: "date", value: "2020-01-01" },
        { name: "degree", value: "Maths" },
        { name: "birthdate_dateint", value: "20000101" },
        { name: "timestamp", value: "24" },
      ],
      null,
      2
    ),
  });

  const [connections, setConnections] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [credDefs, setCredDefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // 🔹 初始化 — 取得 Connections / Schemas / CredentialDefinitions
  useEffect(() => {
    async function fetchInit() {
      try {
        const res = await fetch("/api/credentials/init");
        const data = await res.json();
        if (data.ok) {
          setConnections(data.connections || []);
          setSchemas(data.schemaIds || []);
          setCredDefs(data.credentialDefinitionIds || []);
        } else {
          throw new Error(data.error || "Init failed");
        }
      } catch (err) {
        console.error("Init error:", err);
        setMessage("❌ Failed to load initial data: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchInit();
  }, []);

  // 🔹 表單輸入更新
  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // 🔹 驗證 JSON 格式
  const isValidJson = (text) => {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  };

  // 🔹 提交 Credential
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.ConnectionId || !form.SchemaId || !form.CredentialDefinitionId) {
      setMessage("⚠️ Please fill all required fields.");
      return;
    }

    if (!isValidJson(form.CredentialAttributesObject)) {
      setMessage("⚠️ Credential Attributes must be valid JSON array.");
      return;
    }

    try {
      const res = await fetch("/api/credentials/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.ok) {
        setMessage("✅ Credential sent successfully!");
        // 可導向其他頁面
        // window.location.href = "/connections/active";
      } else {
        throw new Error(data.error || "Send failed");
      }
    } catch (err) {
      console.error("Send error:", err);
      setMessage("❌ " + err.message);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container" style={{ padding: "20px", maxWidth: "800px" }}>
      <h2>Issue Credential</h2>

      {message && (
        <div
          style={{
            background: "#eee",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "10px",
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Connection */}
        <div className="form-group">
          <label>Connection</label>
          <select
            className="form-control"
            value={form.ConnectionId}
            onChange={(e) => updateField("ConnectionId", e.target.value)}
            required
          >
            <option value="">Select a connection</option>
            {connections.map((c) => (
              <option key={c.connection_id} value={c.connection_id}>
                {c.their_label}: {c.connection_id}
              </option>
            ))}
          </select>
        </div>

        {/* Schema */}
        <div className="form-group">
          <label>Schema</label>
          <select
            className="form-control"
            value={form.SchemaId}
            onChange={(e) => updateField("SchemaId", e.target.value)}
            required
          >
            <option value="">Select a schema</option>
            {schemas.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Credential Definition */}
        <div className="form-group">
          <label>Credential Definition</label>
          <select
            className="form-control"
            value={form.CredentialDefinitionId}
            onChange={(e) =>
              updateField("CredentialDefinitionId", e.target.value)
            }
            required
          >
            <option value="">Select a credential definition</option>
            {credDefs.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Attributes */}
        <div className="form-group">
          <label>Credential Attributes (JSON Array)</label>
          <textarea
            className="form-control"
            rows="8"
            value={form.CredentialAttributesObject}
            onChange={(e) =>
              updateField("CredentialAttributesObject", e.target.value)
            }
          ></textarea>
          {!isValidJson(form.CredentialAttributesObject) && (
            <p style={{ color: "red" }}>❌ Invalid JSON format</p>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-lg btn-block">
          Send Credential
        </button>
      </form>
    </div>
  );
}

