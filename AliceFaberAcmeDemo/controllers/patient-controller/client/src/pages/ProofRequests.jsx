import { useState, useEffect } from "react";

export default function ProofRequestsPage() {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProofs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proofs");
      const data = await res.json();
      if (data.ok) {
        setProofs(data.results || []);
      } else {
        alert("❌ Failed to load proof requests: " + data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProofs();
  }, []);

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
      <h2
        style={{
          color: "#003366",
          borderBottom: "3px solid #cce0ff",
          paddingBottom: "8px",
          marginTop: "3px",
          marginBottom: "20px",
          fontWeight: 600,
          fontSize: "25px",
        }}
      >
        Proof Requests
      </h2>

      {loading ? (
        <p>Loading proof requests...</p>
      ) : proofs.length === 0 ? (
        <p>No proof requests available.</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {proofs.map((p) => (
            <div
              key={p.presentation_exchange_id}
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "16px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              }}
            >
              <p>
                <strong>Request ID:</strong> {p.presentation_exchange_id}
              </p>
              <p>
                <strong>State:</strong>{" "}
                <span style={{ color: p.state === "verified" ? "green" : "#666" }}>
                  {p.state}
                </span>
              </p>
              <p>
                <strong>Connection:</strong> {p.connection_id}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
