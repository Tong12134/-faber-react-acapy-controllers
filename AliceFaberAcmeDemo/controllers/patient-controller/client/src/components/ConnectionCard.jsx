import React from "react";

export default function ConnectionCard({ connection, onRefresh }) {
  const { connection_id, their_label, state, created_at } = connection;

  // 狀態顏色對應
  const stateColor = {
    active: "#2d6a4f",
    request: "#1d4ed8",
    response: "#2563eb",
    pending: "#ca8a04",
    error: "#b91c1c",
  }[state] || "#6b7280";

  //  刪除連線
  const handleRemove = async () => {
    const ok = window.confirm(
      `確定要刪除此連線嗎？\n\nconnection_id: ${connection_id}`
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/connections/${connection_id}/remove`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.ok) {
        // 刪除成功後請父層重新載入列表
        onRefresh && onRefresh();
      } else {
        alert("❌ Failed to remove connection: " + (data.error || "Unknown"));
      }
    } catch (err) {
      alert("Network error while removing connection: " + err.message);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "16px 20px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "scale(1.01)";
        e.currentTarget.style.boxShadow = "0 3px 8px rgba(0,0,0,0.15)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
      }}
    >
      {/* 標題列 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <h4
          style={{
            margin: 0,
            color: "#003366",
            fontWeight: 600,
            fontSize: "18px",
          }}
        >
          {their_label || "Unnamed Connection"}
        </h4>

        {/* 狀態徽章 */}
        <span
          style={{
            backgroundColor: stateColor,
            color: "white",
            padding: "4px 10px",
            borderRadius: "12px",
            fontSize: "13px",
            textTransform: "capitalize",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          {state}
        </span>
      </div>

      {/* 內容列 */}
      <div style={{ color: "#444", fontSize: "14px", marginBottom: "4px" }}>
        <strong>Connection ID:</strong> {connection_id}
      </div>
      <div style={{ color: "#444", fontSize: "14px", marginBottom: "4px" }}>
        <strong>Created:</strong>{" "}
        {created_at
          ? new Date(created_at).toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-"}
      </div>

      {/* 動作列 */}
      <div
        style={{
          marginTop: "12px",
          textAlign: "right",
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
        }}
      >
        {/* Delete 按鈕 */}
        <button
          onClick={handleRemove}
          style={{
            backgroundColor: "#b91c1c",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "6px 12px",
            fontSize: "14px",
            cursor: "pointer",
            fontWeight: 500,
            boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#dc2626")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#b91c1c")}
        >
          🗑 Delete
        </button>

        {/* 原本的 Refresh 按鈕 */}
        <button
          onClick={onRefresh}
          style={{
            backgroundColor: "#1e3a5f",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "6px 14px",
            fontSize: "14px",
            cursor: "pointer",
            fontWeight: 500,
            boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#2c5282")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#1e3a5f")}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
