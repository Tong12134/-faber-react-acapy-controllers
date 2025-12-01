import { useState, useEffect } from "react";

// 針對特定 Schema 名稱，寫死欄位順序
const SCHEMA_ATTR_ORDER = {
  
  InsurancePolicyV1: [
    "policy_id",
    "insured_id",
    "insured_name",
    "product_name",
    "coverage_type",
    "coverage_start_date",
    "coverage_end_date",
    "hospital_daily_cash",
    "surgery_benefit",
    "timestamp",
  ],

  // 如果你現在後端仍然用這種 schema_name，也順便支援
  // insurance_policy: ["name", "date", "degree", "birthdate_dateint", "timestamp"],
};

// 每個 schema 的「預設示範值」
const INSURER_DEMO_VALUES = {
  policy_id: "POLICY-DEMO-001",
  insured_id: "patient-001",
  insured_name: "王小明",
  product_name: "住院日額險方案 A",
  coverage_type: "Hospitalization+Surgery",
  coverage_start_date: "2025-01-01",
  coverage_end_date: "2026-01-01",
  hospital_daily_cash: "2000",      // 每日住院日額
  surgery_benefit: "10000",         // 手術一次金
  timestamp: "2025-06-01T10:00:00+08:00",
};


// 根據 schemaId + 原本 attrNames，決定最後要用的順序
const getOrderedAttrNames = (schemaId, attrNames = []) => {
  const parts = (schemaId || "").split(":");

  // did:sov:xxx:SchemaName:1.0.0 → 通常第 3 個是名稱
  let schemaName = "";
  if (parts.length >= 4) {
    schemaName = parts[2]; // ex: InsurancePolicyV1 
  } else {
    schemaName = schemaId;
  }

  console.log(`[Sort Debug] ID: ${schemaId} -> Parsed Name: ${schemaName}`);

  const customOrder = SCHEMA_ATTR_ORDER[schemaName];

  if (!customOrder) {
    // 沒寫死順序就照 ACA-Py 回傳原本的順序
    return attrNames;
  }


  const availableSet = new Set(attrNames);

  // 1) 先把有定義順序 & 實際存在的欄位排好
  const sorted = customOrder.filter((name) => availableSet.has(name));

  // 2) 如果有新的欄位不在 customOrder 裡，補在最後
  const sortedSet = new Set(sorted);
  const others = attrNames.filter((name) => !sortedSet.has(name));

  return [...sorted, ...others];
};


// 根據 schema.attrNames 產生預設的 Attributes JSON
  const buildAttributesTemplate = (attrNames = [], defaults = {}) =>
  JSON.stringify(
    (attrNames || []).map((name) => ({
      name,
      // 這樣寫才安全：如果 defaults 裡有就用，沒有就用空字串
      value: defaults[name] ?? "",
    })),
    null,
    2
  );

  

export default function CredentialsPage() {
  const [form, setForm] = useState({
    ConnectionId: "",
    SchemaId: "",
    CredentialDefinitionId: "",
    // 一開始先給空陣列，選到 Schema 後再自動帶欄位
    CredentialAttributesObject: "[]",
  });

  const [connections, setConnections] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [credDefs, setCredDefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // 初始化
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

  // 選到 Schema：去後端拿 attrNames，重建 Attributes JSON
  const handleSchemaChange = async (e) => {
    const schemaId = e.target.value;

    // 先記住現在選哪個 schema
    updateField("SchemaId", schemaId);

    if (!schemaId) {
      // 清空選擇 → 把 attributes 也清空
      updateField("CredentialAttributesObject", "[]");
      return;
    }

    try {
      const res = await fetch(
        `/api/credentialSchemas/${encodeURIComponent(schemaId)}`
      );
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to load schema");
      }

      // 後端可能回傳的結構：
      // { schema: { attrNames: [...] } } or { result: { schema: { attrNames: [...] } } }
      const schemaObj =
        data.schema || data.result?.schema || data.result || data;

      const attrNames =
        schemaObj?.attrNames || schemaObj?.schema?.attrNames || [];

      console.log("[Insurer Schema debug] schemaId =", schemaId);
      console.log("[Insurer Schema debug] raw attrNames =", attrNames);

      // 套用「寫死順序」：用 attrNames 當 rawAttrNames 傳進去
      const finalAttrNames = getOrderedAttrNames(schemaId, attrNames);
      console.log("[Insurer Schema debug] finalAttrNames =", finalAttrNames);

      
    // 先從 schemaId 判斷 schemaName
    const parts = schemaId.split(":");
    const schemaName = parts.length >= 3 ? parts[2] : schemaId;

    // 如果未來有別的 schema 不想帶預設，可以在這裡判斷
    const defaults =
      schemaName === "InsurancePolicyV1" ? INSURER_DEMO_VALUES : {};

    updateField(
      "CredentialAttributesObject",
      buildAttributesTemplate(finalAttrNames, defaults)
    );

    } catch (err) {
      console.error("load schema error:", err);
      setMessage("⚠️ Failed to load schema attributes: " + err.message);
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
      {/* 頁面標題 */}
      <h2
        style={{
          color: "#003366",
          borderBottom: "3px solid #cce0ff",
          paddingBottom: "8px",
          marginTop: "3px",
          marginBottom: "16px",
          fontWeight: 600,
        }}
      >
        Issue Credential
      </h2>

      {/* 狀態提示框 */}
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

      {/* 表單 */}
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
          <label
            style={{ fontWeight: 500, color: "#003366", fontSize: "21px" }}
          >
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
          <label
            style={{ fontWeight: 500, color: "#003366", fontSize: "21px" }}
          >
            Schema
          </label>
          <select
            value={form.SchemaId}
            onChange={handleSchemaChange}
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
          <label
            style={{ fontWeight: 500, color: "#003366", fontSize: "21px" }}
          >
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
          <label
            style={{ fontWeight: 500, color: "#003366", fontSize: "21px" }}
          >
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
              resize: "vertical",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
            }}
          ></textarea>
          {!isValidJson(form.CredentialAttributesObject) && (
            <p style={{ color: "red", marginTop: "6px" }}>
              Invalid JSON format!
            </p>
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
