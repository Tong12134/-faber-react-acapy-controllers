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
  try {
    const { id } = req.params;
    const record = await acapy.acceptCredentialOffer(id);
    res.json({ ok: true, record });
  } catch (err) {
    console.error("[credentialOffers] accept error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
