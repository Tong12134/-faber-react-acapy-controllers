import acapy from "./acapy.js";
import { state } from "./memory.js";
import express from "express";

const router = express.Router();

// 建立邀請
router.post("/create-invitation", async (req, res, next) => {
  try {
    const { auto_accept = true, alias = "hospital" } = req.body || {};
    const r = await acapy.post("/connections/create-invitation", {
      auto_accept,
      alias
    });
    res.json(r.data); // 包含 invitation_url、invitation JSON
  } catch (e) {
    next(e);
  }
});

// 取回連線列表
router.get("/", async (req, res, next) => {
  try {
    const r = await acapy.get("/connections");
    res.json(r.data);
  } catch (e) {
    next(e);
  }
});

export default router;
