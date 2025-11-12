import express from "express";
import * as acapy from "./acapy.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const results = await acapy.getConnections();
    res.json({ ok: true, results });
  } catch (err) {
    console.error("get connections error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post("/receive-invitation", async (req, res) => {
  try {
    const data = await acapy.receiveInvitation(req.body);
    res.json({ ok: true, data });
  } catch (err) {
    console.error("receive invitation error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
