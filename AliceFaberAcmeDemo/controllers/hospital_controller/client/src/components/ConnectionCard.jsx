export default function ConnectionCard({ connection, onRefresh }) {
  const { their_label, connection_id, state } = connection;

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "12px",
        borderRadius: "8px",
        marginBottom: "10px",
      }}
    >
      <h4>{their_label || "Unnamed Connection"}</h4>
      <p>ID: {connection_id}</p>
      <p>State: <strong>{state}</strong></p>
      <button onClick={onRefresh} className="btn btn-sm btn-secondary">
        Refresh
      </button>
    </div>
  );
}
