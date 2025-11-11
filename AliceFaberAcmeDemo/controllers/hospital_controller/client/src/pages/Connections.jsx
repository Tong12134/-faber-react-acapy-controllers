import { useState, useEffect } from "react";
import ConnectionCard from "../components/ConnectionCard";
import NewConnectionForm from "../components/NewConnectionForm";
import AcceptConnectionForm from "../components/AcceptConnectionForm";

export default function ConnectionsPage() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/connections");
      const data = await res.json();
      if (data.ok) {
        setConnections(data.results || []);
      } else {
        alert("Failed to load connections: " + data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#f8faff", // 柔藍背景
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        minHeight: "70vh",
      }}
    >
      {/* ✅ 頁面標題 */}
      <h2
        style={{
          color: "#003366",
          borderBottom: "3px solid #cce0ff",
          paddingBottom: "8px",
          marginTop: "0px",
          marginBottom: "24px",
          fontWeight: 600,
          fontSize: "25px",
          letterSpacing: "0.5px",
        }}
      >
         Connections
      </h2>

      {/* ✅ 連線操作卡片區（建立 + 接受） */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        {/* 建立連線 */}
        <div
          style={{
            flex: "1 1 300px",
            backgroundColor: "#ffffff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 1px 5px rgba(0,0,0,0.08)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = "0 1px 5px rgba(0,0,0,0.08)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <h4
            style={{
              color: "#003366",
              borderBottom: "2px solid #e0ebff",
              paddingBottom: "6px",
              marginTop: "3px",
              marginBottom: "12px",
              fontSize: "19px",
            }}
          >
            ➕ New Connection
          </h4>
          <NewConnectionForm onCreated={fetchConnections} />
        </div>

        {/* 接受連線 */}
        <div
          style={{
            flex: "1 1 300px",
            backgroundColor: "#ffffff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 1px 5px rgba(0,0,0,0.08)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = "0 1px 5px rgba(0,0,0,0.08)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <h4
            style={{
              color: "#003366",
              borderBottom: "2px solid #e0ebff",
              paddingBottom: "6px",
              marginTop: "3px",
              marginBottom: "12px",
              fontSize: "19px",
            }}
          >
            📨 Accept Connection
          </h4>
          <AcceptConnectionForm onAccepted={fetchConnections} />
        </div>
      </div>

      {/* ✅ 連線列表 */}
      {loading ? (
        <p style={{ color: "#666" }}>Loading connections...</p>
      ) : connections.length === 0 ? (
        <p style={{ color: "#999" }}>No connections yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "16px",
          }}
        >
          {connections.map((c) => (
            <div
              key={c.connection_id}
              style={{
                backgroundColor: "white",
                borderRadius: "10px",
                padding: "18px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                borderLeft: c.state === "active" ? "4px solid #33cc66" : "4px solid #999",
                transition: "box-shadow 0.2s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)")}
              onMouseOut={(e) => (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)")}
            >
              <ConnectionCard connection={c} onRefresh={fetchConnections} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
