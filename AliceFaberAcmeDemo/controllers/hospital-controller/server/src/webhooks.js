import { state } from "./memory.js";

export default async function webhooks(req, res) {
  const { topic } = req.params;
  const body = req.body;

  state.lastWebhookAt = new Date().toISOString();

  switch (topic) {
    case "connections":
      // 追加或更新連線狀態
      // 這裡簡單記錄；真實可做索引/去重
      state.connections.push(body);
      break;
    case "issue_credential_v2_0":
      state.credentials.push(body);
      break;
    case "present_proof_v2_0":
      state.proofs.push(body);
      break;
    default:
      // ignore others or log
      break;
  }

  res.json({ ok: true });
}
