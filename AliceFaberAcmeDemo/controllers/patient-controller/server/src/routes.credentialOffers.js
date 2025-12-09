// server/src/routes.credentialOffers.js
import express from "express";
import * as acapy from "./acapy.js";

const router = express.Router();

// GET /api/credentialOffers
router.get("/", async (req, res) => {
  try {
    const offers = await acapy.getCredentialOffers();
    res.json({ ok: true, offers });
  } catch (err) {
    console.error("[credentialOffers] get error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/credentialOffers/:id/accept
router.post("/:id/accept", async (req, res) => {
  const credExId = req.params.id;

  try {
    // 1) 先把這筆 exchange record 抓出來，看它綁的是哪條 connection
    let record;
    try {
      record = await acapy.getCredentialRecord(credExId);
    } catch (err) {
      const msg = String(err.message || "");

      // 👉 如果 ACA-Py 回 404，代表這筆 record 已經不在 agent 了
      if (msg.includes("Record not found")) {
        return res.status(400).json({
          ok: false,
          error:
            "This credential offer no longer exists on the agent. " +
            "It may have been processed or deleted already. " +
            "Please refresh the page and try again.",
        });
      }

      // 其它錯誤就往外丟
      throw err;
    }

    const connId = record.connection_id;

    if (!connId) {
      return res
        .status(400)
        .json({
          ok: false,
          error: "This offer has no connection_id. It is invalid.",
        });
    }

    // 2) 檢查 connection 還在不在、是不是 active
    let conn;
    try {
      conn = await acapy.getConnection(connId);
    } catch {
      conn = null;
    }

    if (!conn || conn.state !== "active") {
      return res.status(400).json({
        ok: false,
        error:
          "The connection for this credential offer no longer exists. " +
          "Please create a new connection and ask the issuer to send a new offer.",
      });
    }

    // 3) 真的沒問題才呼叫 acceptCredentialOffer
    const result = await acapy.acceptCredentialOffer(credExId);
    res.json({ ok: true, result });
  } catch (err) {
    console.error("[credentialOffers] accept error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});



// 拒絕一個 credential offer
router.post("/:id/reject", async (req, res) => {
  const credExId = req.params.id;
  const { reason } = req.body || {};

  try {
    const result = await acapy.rejectCredentialOffer(
      credExId,
      reason || "User rejected credential offer"
    );
    res.json({ ok: true, result });
  } catch (err) {
    console.error("[PS] [/api/credentialOffers/:id/reject] error:", err.message);
    res.status(400).json({ ok: false, error: err.message });
  }
});



export default router;
