import React from "react";
import { api } from "../api";

export default function Verify() {
  const [connection_id, setConnectionId] = React.useState("");
  const [res, setRes] = React.useState(null);
  const [err, setErr] = React.useState("");

  const submit = async () => {
    setErr("");
    try {
      const r = await api.requestProof({ connection_id });
      setRes(r);
    } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <h3>Request Proof</h3>
      <div>Connection ID：<input value={connection_id} onChange={e=>setConnectionId(e.target.value)} /></div>
      <button onClick={submit}>Send Proof Request</button>
      {err && <pre style={{ color: "crimson" }}>{err}</pre>}
      {res && <pre>{JSON.stringify(res, null, 2)}</pre>}
    </div>
  );
}
