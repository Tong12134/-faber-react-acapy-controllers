// client/src/pages/Connections.jsx
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
    <div className="container" style={{ maxWidth: "800px", padding: "20px" }}>
      <h2>Connections</h2>

      <NewConnectionForm onCreated={fetchConnections} />
      <AcceptConnectionForm onAccepted={fetchConnections} />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {connections.length === 0 ? (
            <p>No connections yet.</p>
          ) : (
            connections.map((c) => (
              <ConnectionCard
                key={c.connection_id}
                connection={c}
                onRefresh={fetchConnections}
              />
            ))
          )}
        </>
      )}
    </div>
  );
}
