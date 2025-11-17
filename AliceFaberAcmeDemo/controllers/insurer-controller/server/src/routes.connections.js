// server/src/routes.connections.js
import express from "express";
import * as acapy from "./acapy.js";

const router = express.Router();

/**
 * GET /api/connections
 * 取得所有連線
 * （假設在主程式是 app.use("/api/connections", router)）
 */
router.get("/", async (req, res) => {
  try {
    const results = await acapy.getConnections();
    res.json({ ok: true, results });
  } catch (err) {
    console.error("get connections error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/connections/create-invitation
 * Mode A: DID Exchange – 建立 Invitation 給前端產 QRCode
 */
router.post("/create-invitation", async (req, res) => {
  try {
    // 🔹 這裡改成呼叫 DID Exchange 的 createInvitation
    const data = await acapy.createInvitation();

    // ACA-Py 回傳的大致格式：
    // {
    //   "connection_id": "...",
    //   "invitation": { ... },
    //   "invitation_url": "didcomm://..."
    // }

    res.json({
      ok: true,
      connection_id: data.connection_id,
      invitation: data.invitation,
      invitation_url: data.invitation_url,
    });
  } catch (err) {
    console.error("create-invitation error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/connections/receive-invitation
 * 由另一個 Agent 端使用 invitation 物件建立連線
 */
router.post("/receive-invitation", async (req, res) => {
  try {
    const d = await acapy.receiveInvitation(req.body);
    res.json({ ok: true, data: d });
  } catch (err) {
    console.error("receive-invitation error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/connections/:id/remove
 * 刪除連線
 */
router.post("/:id/remove", async (req, res) => {
  try {
    await acapy.removeConnection(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("remove connection error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
