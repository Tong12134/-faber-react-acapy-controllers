import React from "react";
import { api } from "../api";

export default function Connections() {
  const [list, setList] = React.useState(null);
  const [invite, setInvite] = React.useState(null);
  const [err, setErr] = React.useState("");

  const refresh = () => api.listConnections().then(setList).catch(e => setErr(e.message));

  React.useEffect(() => { refresh(); }, []);

  return (
    <div>
      <h3>Connections</h3>
      <button onClick={() => api.createInvitation().then(setInvite).then(refresh)}>建立邀請</button>
      {invite && (
        <>
          <h4>Invitation</h4>
          <pre>{JSON.stringify(invite, null, 2)}</pre>
          <div>Invitation URL：<a href={invite?.invitation_url} target="_blank">{invite?.invitation_url}</a></div>
        </>
      )}
      <hr/>
      <button onClick={refresh}>重新整理</button>
      <pre>{JSON.stringify(list, null, 2)}</pre>
      {err && <pre style={{ color: "crimson" }}>{err}</pre>}
    </div>
  );
}
