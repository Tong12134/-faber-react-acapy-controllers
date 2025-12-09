export async function getJSON(url, opts={}) {
  const r = await fetch(url, opts);
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || r.statusText);
  return data;
}

export const api = {
  status: () => getJSON("/api/agent/status"),
  createInvitation: () =>
    getJSON("/api/connections/create-invitation", { method: "POST" }),
  listConnections: () => getJSON("/api/connections"),
  issue: (payload) =>
    getJSON("/api/issue/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),
  requestProof: (payload) =>
    getJSON("/api/verify/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
};
