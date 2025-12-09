// server/src/routes.connections.js
import express from "express";
import * as acapy from "./acapy.js";

const router = express.Router();

/** Get connections */
router.get("/", async (req, res) => {
  try {
    const results = await acapy.getConnections();
    res.json({ ok: true, results });
  } catch (err) {
    console.error("GET /api/connections error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** Create invitation（Out-of-Band 邀請） */
router.post("/create-invitation", async (req, res) => {
  try {
    const data = await acapy.createInvitation(); // ← 改成用新的 OOB 版本

    res.json({
      ok: true,
      invitation: data.invitation,
      invitation_url: data.invitation_url,
    });
  } catch (err) {
    console.error("create-invitation error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** Receive invitation */
router.post("/receive-invitation", async (req, res) => {
  try {
    const d = await acapy.receiveInvitation(req.body);
    res.json({ ok: true, data: d });
  } catch (err) {
    console.error("receive-invitation error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** Remove connection */
router.post("/:id/remove", async (req, res) => {
  try {
    await acapy.removeConnection(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("[HS] remove-connection error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** Accept DIDExchange request */
router.post("/:id/accept-request", async (req, res) => {
  try {
    const d = await acapy.acceptRequest(req.params.id);
    res.json({ ok: true, data: d });
  } catch (err) {
    console.error("accept-request error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});


export default router;
