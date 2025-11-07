// server/src/routes.connections.js
import express from "express";
import * as acapy from "./acapy.js";

const router = express.Router();

/**
 * GET /api/connections
 * 取得所有 connections（對應 /connections）
 */
router.get("/", async (req, res) => {
  try {
    const data = await acapy.getConnections();
    res.json({ ok: true, results: data });
  } catch (err) {
    console.error("get connections error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/connections/create-invitation
 * 建立新的連線邀請（對應 /connections/create-invitation）
 */
router.post("/create-invitation", async (req, res) => {
  try {
    const data = await acapy.createInvitation();
    res.json({ ok: true, ...data });
  } catch (err) {
    console.error("create invitation error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/connections/receive-invitation
 * 接受邀請連線（對應 /connections/receive-invitation）
 */
router.post("/receive-invitation", async (req, res) => {
  try {
    const invitation = req.body;
    const data = await acapy.receiveInvitation(invitation);
    res.json({ ok: true, ...data });
  } catch (err) {
    console.error("receive invitation error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/connections/:id
 * 取得單一 connection 詳細資料（對應 /connections/{id}）
 */
router.get("/:id", async (req, res) => {
  try {
    const data = await acapy.getConnection(req.params.id);
    res.json({ ok: true, result: data });
  } catch (err) {
    console.error("get connection error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/connections/:id/accept-invitation
 * 接受某一筆邀請（對應 /connections/{id}/accept-invitation）
 */
router.post("/:id/accept-invitation", async (req, res) => {
  try {
    const data = await acapy.acceptInvitation(req.params.id);
    res.json({ ok: true, result: data });
  } catch (err) {
    console.error("accept invitation error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
