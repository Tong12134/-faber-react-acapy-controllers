import React from "react";
import { api } from "../api";

export default function Issue() {
  const [connection_id, setConnectionId] = React.useState("");
  const [subject_id, setSubjectId] = React.useState("patient-001");
  const [diagnosis, setDiagnosis] = React.useState("Common Cold");
  const [res, setRes] = React.useState(null);
  const [err, setErr] = React.useState("");

  const submit = async () => {
    setErr("");
    try {
      const r = await api.issue({ connection_id, subject_id, diagnosis });
      setRes(r);
    } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <h3>Issue Diagnostic Credential</h3>
      <div>Connection ID：<input value={connection_id} onChange={e=>setConnectionId(e.target.value)} /></div>
      <div>Subject ID：<input value={subject_id} onChange={e=>setSubjectId(e.target.value)} /></div>
      <div>Diagnosis：<input value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} /></div>
      <button onClick={submit}>Issue</button>
      {err && <pre style={{ color: "crimson" }}>{err}</pre>}
      {res && <pre>{JSON.stringify(res, null, 2)}</pre>}
    </div>
  );
}
