import React from "react";
import { api } from "../api";

export default function Dashboard() {
  const [status, setStatus] = React.useState(null);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    api
      .status()
      .then(setStatus)
      .catch((e) => setErr(e.message));
  }, []);

  const ok = status?.ok;

  return (
    <div
      style={{
        backgroundColor: "#f8faff",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        minHeight: "60vh",
      }}
    >
      {/* ✅ 標題 */}
      <h2
        style={{
          color: "#003366",
          borderBottom: "3px solid #cce0ff",
          paddingBottom: "8px",
          marginTop: "0px",
          marginBottom: "24px",
          fontWeight: 600,
        }}
      >
        🏥 Agent Dashboard
      </h2>

      {/* ✅ 狀態卡片 */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "10px",
          padding: "20px 24px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          marginBottom: "20px",
        }}
      >
        <h3
          style={{
            color: "#003366",
            fontWeight: 600,
            marginBottom: "10px",
          }}
        >
          Agent Status
        </h3>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: "16px",
            color: "#333",
            marginBottom: "12px",
          }}
        >
          <span style={{ marginRight: "8px" }}>狀態燈號：</span>

          {/* ✅ 狀態燈 */}
          <span
            style={{
              display: "inline-block",
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: ok ? "#33cc66" : "#cc3333",
              boxShadow: ok
                ? "0 0 8px rgba(51,204,102,0.6)"
                : "0 0 8px rgba(204,51,51,0.6)",
              marginRight: "10px",
              transition: "background 0.3s ease",
            }}
          />
          <span
            style={{
              fontWeight: 600,
              color: ok ? "#006600" : "#990000",
            }}
          >
            {ok ? "Connected" : "Disconnected"}
          </span>
        </div>

        {/* ✅ 錯誤訊息 */}
        {err && (
          <pre
            style={{
              color: "crimson",
              backgroundColor: "#fff4f4",
              border: "1px solid #ffd6d6",
              borderRadius: "6px",
              padding: "10px",
              marginTop: "12px",
            }}
          >
            {err}
          </pre>
        )}
      </div>

      {/* ✅ 顯示 Agent 回傳資訊 */}
      {status && (
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "10px",
            padding: "16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <h4
            style={{
              color: "#003366",
              marginBottom: "8px",
              borderBottom: "2px solid #e0ebff",
              paddingBottom: "4px",
            }}
          >
            Status Detail
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
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
