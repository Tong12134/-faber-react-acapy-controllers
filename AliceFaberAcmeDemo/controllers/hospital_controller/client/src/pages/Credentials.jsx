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

  // 🔹 初始化
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

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isValidJson = (text) => {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  };

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
    <div
      style={{
        backgroundColor: "#f8faff",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        minHeight: "70vh",
      }}
    >
      {/*  頁面標題 */}
      <h2
        style={{
          color: "#003366",
          borderBottom: "3px solid #cce0ff",
          paddingBottom: "8px",
          marginTop: "3px",
          marginBottom: "16px",
          fontWeight: 600,
        }}
      > Issue Credential </h2>

      {/*  狀態提示框 */}
      {message && (
        <div
          style={{
            backgroundColor: message.startsWith("✅") ? "#e6ffe6" : "#fff4e6",
            color: message.startsWith("✅") ? "#006600" : "#993300",
            border: message.startsWith("✅")
              ? "1px solid #66cc66"
              : "1px solid #ffcc66",
            borderRadius: "8px",
            padding: "10px 16px",
            marginBottom: "16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          }}
        >
          {message}
        </div>
      )}

      {/* ✅ 表單區塊 */}
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          boxShadow: "0 1px 5px rgba(0,0,0,0.1)",
        }}
      >
        {/* Connection */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontWeight: 500, color: "#003366", fontSize: "21px" }}>
            Connection
          </label>
          <select
            value={form.ConnectionId}
            onChange={(e) => updateField("ConnectionId", e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccd9ff",
              marginTop: "8px",
              fontSize: "15px",
            }}
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
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontWeight: 500, color: "#003366", fontSize: "21px" }}>
            Schema
          </label>
          <select
            value={form.SchemaId}
            onChange={(e) => updateField("SchemaId", e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccd9ff",
              marginTop: "8px",
              fontSize: "15px",
            }}
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
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontWeight: 500, color: "#003366", fontSize: "21px" }}>
            Credential Definition
          </label>
          <select
            value={form.CredentialDefinitionId}
            onChange={(e) =>
              updateField("CredentialDefinitionId", e.target.value)
            }
            required
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccd9ff",
              marginTop: "8px",
              fontSize: "15px",
            }}
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
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontWeight: 500, color: "#003366", fontSize: "21px" }}>
            Credential Attributes (JSON Array)
          </label>
          <textarea
            rows="12"
            value={form.CredentialAttributesObject}
            onChange={(e) =>
              updateField("CredentialAttributesObject", e.target.value)
            }
            style={{
              width: "100%",
              height: "230px",
              marginTop: "8px",
              borderRadius: "6px",
              border: "1px solid #ccd9ff",
              padding: "10px",
              fontFamily: "monospace",
              fontSize: "14px",
              backgroundColor: "#f9faff",
              lineHeight: "1.5",
              resize: "vertical", // 允許使用者拖拉改大小（上下）
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)", // 內陰影，看起來更有層次
            }}
          ></textarea>
          {!isValidJson(form.CredentialAttributesObject) && (
            <p style={{ color: "red", marginTop: "6px" }}> Invalid JSON format!</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          style={{
            width: "100%",
            backgroundColor: "#003366",
            color: "white",
            fontSize: "16px",
            fontWeight: "600",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#004b99")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#003366")}
        >
          Send Credential
        </button>
      </form>
    </div>
  );
}
