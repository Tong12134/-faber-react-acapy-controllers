import { useState, useEffect } from "react";

// 每個 schema 想要固定的欄位順序
const SCHEMA_ATTR_ORDER = {

  // HospitalEncounterSummaryV1 的順序就鎖成這樣：
  // 用 "Schema Name" 當作 Key，這樣就不怕 ID 變來變去
  "HospitalEncounterSummaryV1": [
    "patient_id",
    "patient_name", 
    "patient_birthdate_dateint", 
    "encounter_id",
    "encounter_date",
    "encounter_class",
    "encounter_department",
    "diagnosis_system",
    "diagnosis_code",
    "diagnosis_display",
    "admission_date",
    "discharge_date",
    "procedure_code",
    "procedure_display",
    "provider_org_name",
    "provider_org_id",
    "fhir_bundle_id",
    "fhir_bundle_hash",
    "record_type",
    "timestamp",
  ],

   // 之後如果有別的 schema，也可以這樣加：
  // "did:schema:...:OtherSchema:1.0.0": ["fieldA", "fieldB", "fieldC"],
};

// 根據 schemaId + 原本 attrNames，決定最後要用的順序
const getOrderedAttrNames = (schemaId, attrNames = []) => {

  // 我們試著從字串中抓出 Schema Name
  const parts = schemaId.split(':');

  // 如果格式正確，Name 通常在倒數第二個位置 (或是 Index 2)
  let schemaName = "";
  if (parts.length >= 4) {
      schemaName = parts[2]; 
  } else {
      // 如果格式很怪，就 fallback 用整個 ID 試試看
      schemaName = schemaId;
  }

  console.log(`[Sort Debug] ID: ${schemaId} -> Parsed Name: ${schemaName}`);

  const customOrder = SCHEMA_ATTR_ORDER[schemaName];

  // 如果找不到對應的順序設定，就直接回傳原本的
  if (!customOrder) {

    console.warn(`[Sort Debug] No custom order found for ${schemaName}`);
    return attrNames;
  }

  // 只保留 attrNames 中真的存在的欄位，並依照 customOrder 排序
  const availableSet = new Set(attrNames);
  
  // 1. 先抓出我們有定義順序且實際存在的欄位
  const sorted = customOrder.filter((name) => availableSet.has(name));
  
  // 2. (選用) 如果有一些新欄位不在我們的順序表裡，把它們補在最後面
  const sortedSet = new Set(sorted);
  const others = attrNames.filter(name => !sortedSet.has(name));

  return [...sorted, ...others];

  // // 只保留 attrNames 中真的存在的欄位，避免 schema 變動時爆掉
  // const set = new Set(attrNames);
  // return customOrder.filter((name) => set.has(name));
};

// 根據 schema.attrNames 產生預設的 Attributes JSON
const buildAttributesTemplate = (attrNames = []) =>
  JSON.stringify(
    (attrNames || []).map((name) => ({
      name,
      value: "",
    })),
    null,
    2
  );

export default function CredentialsPage() {
  const [form, setForm] = useState({
    ConnectionId: "",
    SchemaId: "",
    CredentialDefinitionId: "",
    // 一開始先給空陣列，等選到 Schema 再自動帶欄位進來
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

          // --- 過濾邏輯開始 ---
          const allSchemas = data.schemaIds || [];

          // 我們只想要顯示 "HospitalEncounterSummaryV1" (沒有空格的)
          // 或是過濾掉那些有空格的
          const cleanSchemas = allSchemas.filter(id => {
             // 排除包含 "V1 " (有空格) 的 ID
             if (id.includes("HospitalEncounterSummaryV1 ")) return false;
             
             // 或者：只保留我想要的特定版本或名稱
             // return id.includes("HospitalEncounterSummaryV1");
             
             return true;
          });
          // --- 過濾邏輯結束 ---

          setSchemas(cleanSchemas); // 設定過濾後的清單
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

  // 選到 Schema 的時候：更新 SchemaId，並依照 schema 的 attrNames 重建 Attributes JSON
  const handleSchemaChange = async (e) => {
  const schemaId = e.target.value;

  // 先記錄目前選的是哪個 schema
  updateField("SchemaId", schemaId);

  if (!schemaId) {
    // 若清空選擇，就把 attributes 也清掉
    updateField("CredentialAttributesObject", "[]");
    return;
  }

  try {
    // 去後端拿這個 schema 的細節
    const res = await fetch(
      `/api/credentialSchemas/${encodeURIComponent(schemaId)}`
    );
    const data = await res.json();
    if (!data.ok) {
      throw new Error(data.error || "Failed to load schema");
    }

    // 根據你後端回傳的結構抓 attrNames
    // 常見幾種：data.schema.attrNames / data.result.schema.attrNames / data.attrNames
    const schemaObj =
      data.schema || data.result?.schema || data.result || data;

    const attrNames =
      schemaObj?.attrNames || schemaObj?.schema?.attrNames || [];

    console.log("[Schema debug] schemaId =", schemaId);
    console.log("[Schema debug] raw attrNames =", attrNames);

    // 套用「寫死順序」：用 attrNames 當 rawAttrNames 傳進去
    const finalAttrNames = getOrderedAttrNames(schemaId, attrNames);

    console.log("[Schema debug] finalAttrNames =", finalAttrNames);

    // 用「排好順序的 finalAttrNames」重建 Attributes JSON
    updateField(
      "CredentialAttributesObject",
      buildAttributesTemplate(finalAttrNames)
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
  
  //

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
      >
        Issue Credential
      </h2>

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
              border: "1px solid  #ccd9ff",
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
              resize: "vertical",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
            }}
          ></textarea>
          {!isValidJson(form.CredentialAttributesObject) && (
            <p style={{ color: "red", marginTop: "6px" }}>Invalid JSON format!</p>
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
