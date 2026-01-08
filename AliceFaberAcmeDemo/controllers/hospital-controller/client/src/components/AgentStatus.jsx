import React, { useEffect, useState } from "react";

export default function AgentStatus({ showLabel = false }) {
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  async function checkStatus() {
    try {
      const res = await fetch("/api/agent/status");
      const data = await res.json();
      setIsOnline(data.ok === true);
    } catch {
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkStatus();
    const timer = setInterval(checkStatus, 5000);
    return () => clearInterval(timer);
  }, []);

  const color = loading ? "#888" : isOnline ? "#00ff66"  : "#ff4d4f";
  const glow = isOnline
    ? "0 0 12px #00ff66"
    : loading
    ? "0 0 6px #aaa"
    : "0 0 12px #ff4d4f";
    
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* ✅ 放大狀態燈 */}
      <div
        style={{
          width: 20,         
          height: 20,         
          borderRadius: "50%",
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`, // 陰影跟著變大
          transition: "background-color 0.3s, box-shadow 0.3s",
        }}
      />

      {/* ✅ 根據 showLabel 決定是否顯示文字（預設 false） */}
      {showLabel && (
        <span style={{ fontSize: 14, color: "#555" }}>
          {isOnline ? "Connected" : "Disconnected"}
        </span>
      )}
    </div>
  );
}
