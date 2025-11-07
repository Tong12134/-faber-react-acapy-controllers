import React from "react";
import { api } from "../api";

export default function Dashboard() {
  const [status, setStatus] = React.useState(null);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    api.status().then(setStatus).catch(e => setErr(e.message));
  }, []);

  const ok = status?.ok;

  return (
    <div>
      <h3>Agent Status</h3>
      <div>
        狀態燈號：
        <span style={{
          display: "inline-block", width: 12, height: 12, borderRadius: 6,
          background: ok ? "limegreen" : "crimson", margin: "0 6px"
        }} />
        {ok ? "Connected" : "Disconnected"}
      </div>
      {err && <pre style={{ color: "crimson" }}>{err}</pre>}
      {status && <pre>{JSON.stringify(status, null, 2)}</pre>}
    </div>
  );
}
