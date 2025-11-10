import { useEffect, useState } from "react";

export default function AgentStatus() {
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

  // 初次執行 + 每 5 秒檢查一次
  useEffect(() => {
    checkStatus();
    const timer = setInterval(checkStatus, 5000);
    return () => clearInterval(timer);
  }, []);

  // 顯示狀態燈
  const color = loading ? "gray" : isOnline ? "green" : "red";
  const label = loading
    ? "Checking..."
    : isOnline
    ? "Agent Connected"
    : "Agent Disconnected";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          backgroundColor: color,
          boxShadow: `0 0 5px ${color}`,
          transition: "background-color 0.3s",
        }}
      />
      <span style={{ fontSize: 14, color: "#555" }}>{label}</span>
    </div>
  );
}
