import { useState, useEffect } from "react";

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/credentials");
      const data = await res.json();
      if (data.ok) {
        setCredentials(data.results || []);
      } else {
        alert("❌ Failed to load credentials: " + data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
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
        My Credentials
      </h2>

      {loading ? (
        <p>Loading credentials...</p>
      ) : credentials.length === 0 ? (
        <p>No credentials found.</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {credentials.map((cred) => (
            <div
              key={cred.referent || cred.cred_id}
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "16px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              }}
            >
              <p>
                <strong>Credential ID:</strong> {cred.cred_id}
              </p>
              <p>
                <strong>Schema:</strong> {cred.schema_id}
              </p>
              <p>
                <strong>Issuer:</strong> {cred.issuer_did}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
