import { useState, useEffect } from "react";
import ConnectionCard from "../components/ConnectionCard";
import NewConnectionForm from "../components/NewConnectionForm";
import AcceptConnectionForm from "../components/AcceptConnectionForm";

export default function ConnectionsPage() {
  const [activeTab, setActiveTab] = useState("connected");
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  //  取得連線資料
  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/connections");
      const data = await res.json();
      if (data.ok) {
        setConnections(data.results || []);
      } else {
        alert("❌ Failed to load connections: " + data.error);
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

  const activeConnections = connections.filter((c) => c.state === "active");
  const pendingConnections = connections.filter((c) => c.state !== "active");

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
          marginBottom: "20px",
          fontWeight: 600,
          fontSize: "28px",
        }}
      >
        Connections
      </h2>

      {/*  Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #e0e8ff",
          marginBottom: "23px",
          fontSize: "17px",
        }}
      >
        {[
          { key: "connected", label: "Connected" },
          { key: "awaiting", label: "Awaiting Response" },
          { key: "create", label: "Create Invitation" },
          { key: "accept", label: "Accept Invitation" },
        ].map(({ key, label }) => (
          <div
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              marginRight: "24px",
              paddingBottom: "8px",
              cursor: "pointer",
              borderBottom:
                activeTab === key
                  ? "3px solid #003366"
                  : "3px solid transparent",
              fontWeight: activeTab === key ? "600" : "400",
              color: activeTab === key ? "#003366" : "#666",
              transition: "all 0.2s ease",
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/*  Connected Tab */}
      {activeTab === "connected" && (
        <div>
          <h4
            style={{
              color: "#003366",
              fontSize: "20px",
              marginBottom: "16px",
            }}
          >
            ✅ Connected
          </h4>
          {loading ? (
            <p style={{ color: "#666", fontSize: "16px" }}>
              Loading connections...
            </p>
          ) : activeConnections.length === 0 ? (
            <p style={{ color: "#999", fontSize: "16px" }}>
              No active connections.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {activeConnections.map((c) => (
                <div
                  key={c.connection_id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "10px",
                    padding: "18px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    borderLeft: "4px solid #33cc66",
                  }}
                >
                  <ConnectionCard connection={c} onRefresh={fetchConnections} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/*  Awaiting Tab */}
      {activeTab === "awaiting" && (
        <div>
          <h4
            style={{
              color: "#003366",
              fontSize: "20px",
              marginBottom: "16px",
            }}
          >
            🕒 Awaiting Response
          </h4>
          {loading ? (
            <p style={{ color: "#666", fontSize: "16px" }}>Loading...</p>
          ) : pendingConnections.length === 0 ? (
            <p style={{ color: "#999", fontSize: "16px" }}>
              No pending invitations.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {pendingConnections.map((c) => (
                <div
                  key={c.connection_id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "10px",
                    padding: "18px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    borderLeft: "4px solid #999",
                  }}
                >
                  <ConnectionCard connection={c} onRefresh={fetchConnections} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/*  Create Tab */}
      {activeTab === "create" && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "10px",
            padding: "24px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h4
            style={{
              color: "#003366",
              fontSize: "20px",
              marginBottom: "12px",
              marginTop: "5px",
            }}
          >
            ➕ Create Invitation
          </h4>
          <NewConnectionForm onCreated={fetchConnections} />
        </div>
      )}

      {/*  Accept Tab */}
      {activeTab === "accept" && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "10px",
            padding: "24px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h4
            style={{
              color: "#003366",
              fontSize: "20px",
              marginBottom: "12px",
              marginTop: "5px",
            }}
          >
            📨 Accept Invitation
          </h4>
          <AcceptConnectionForm onAccepted={fetchConnections} />
        </div>
      )}
    </div>
  );
}
