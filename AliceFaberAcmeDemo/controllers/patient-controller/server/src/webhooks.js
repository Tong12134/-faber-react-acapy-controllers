// server/src/webhooks.js
import express from "express";

const router = express.Router();

/**
 * Webhook endpoint
 * ACA-Py 會 POST JSON 到這裡，例如 topic: "connections", "issue_credential", "present_proof"
 */
router.post("/topic/:topic", async (req, res) => {
  const topic = req.params.topic;
  const body = req.body;

  console.log(` Webhook: ${topic}`);
  console.log(JSON.stringify(body, null, 2));

  // 這裡可根據 topic 實作事件處理
  // 例如：更新前端、紀錄資料庫、通知系統等

  res.status(200).send("ok");
});

export default router;
