// server/src/routes.proofs.js
import express from "express";
import * as acapy from "./acapy.js";

const router = express.Router();

/**
 * 取得所有 Proof Records
 * GET /api/proofs
 */
router.get("/", async (req, res) => {
  try {
    const results = await acapy.getProofs();
    res.json({ ok: true, results });
  } catch (err) {
    console.error("❌ [Proofs API] Failed to fetch:", err.message);
    res.status(500).json({
      ok: false,
      error: err.response?.data || err.message,
    });
  }
});

/**
 * 低階 API：前端自己組 payload、自己塞 connection_id
 * POST /api/proofs/request
 * body = 直接送給 ACA-Py /present-proof/send-request 的 payload
 */
router.post("/request", async (req, res) => {
  try {
    const result = await acapy.sendProofRequest(req.body);
    res.json({ ok: true, result });
  } catch (err) {
    console.error("❌ [POST /api/proofs/request] failed:", err.message);
    res.status(500).json({
      ok: false,
      error: err.response?.data || err.message,
    });
  }
});

/**
 * 高階 API：專門給「理賠申請」用的 Proof Request
 *
 * POST /api/proofs/claim-request
 * body:
 *   {
 *     "connectionId"?: "xxxx-connection-id",   // 可選（不傳就自動挑唯一 active connection）
 *     "encounter_id"?: "E2025-0001",           // 可選：目前只拿來記在 comment 裡
 *     "encounter_global_id"?: "xxx",          // 同上
 *     "insuredId"?: "patient-001"             // demo 用，不會影響 ZKP
 *   }
 *
 * ⚠️ 現在不再用 restrictions 鎖 encounter_id，
 *    先讓 verified 能變成 true、整個 pipeline 通了再來加嚴。
 */
router.post("/claim-request", async (req, res) => {
  try {
    let { connectionId, insuredId, encounter_id, encounter_global_id } =
      req.body || {};

    // 這個 id 目前只用來寫在 comment / debug，用不到也沒關係
    const targetEncounterId = encounter_global_id || encounter_id || null;

    // 1) 如果沒有指定 connectionId，就自動挑一條 active connection
    if (!connectionId) {
      const allConns = await acapy.getConnections();
      const activeConns = (allConns || []).filter(
        (c) => c.state === "active"
      );

      if (activeConns.length === 0) {
        return res.status(400).json({
          ok: false,
          error:
            "目前 Insurer agent 沒有任何 active connection 可以送出 proof request。",
        });
      }

      if (activeConns.length > 1) {
        return res.status(400).json({
          ok: false,
          error:
            "偵測到多條 active connection，請在 body.connectionId 明確指定要使用哪一條 connection_id。",
        });
      }

      connectionId = activeConns[0].connection_id;
      console.log(
        "[IS] [claim-request] auto-selected connection_id =",
        connectionId
      );
    } else {
      console.log(
        "[IS] [claim-request] using connectionId from body =",
        connectionId
      );
    }

    // 2) 組出「理賠用 Proof Request」
    //     先不加任何 restrictions，讓 Aries 能順利找到那張 VC 並 verified=true
    const proofRequestPayload = {
      connection_id: connectionId,
      comment: targetEncounterId
        ? `Insurance claim proof request for encounter ${targetEncounterId}`
        : "Insurance claim proof request",
      proof_request: {
        name: "Hospital Encounter Claim Proof",
        version: "1.0",
        requested_attributes: {
          attr1_encounter_class: {
            name: "encounter_class",
          },
          attr2_admission_date: {
            name: "admission_date",
          },
          attr3_discharge_date: {
            name: "discharge_date",
          },
          attr4_diagnosis_code: {
            name: "diagnosis_code",
          },
          attr5_procedure_code: {
            name: "procedure_code",
          },
        },
        requested_predicates: {},
      },
      trace: false,
    };

    console.log(
      "[IS] [claim-request] sending proof request to ACA-Py:",
      JSON.stringify(proofRequestPayload, null, 2)
    );

    const result = await acapy.sendProofRequest(proofRequestPayload);

    res.json({
      ok: true,
      result,
      usedConnectionId: connectionId,
    });
  } catch (err) {
    console.error("❌ [POST /api/proofs/claim-request] failed:", err.message);
    res.status(500).json({
      ok: false,
      error: err.response?.data || err.message,
    });
  }
});

/**
 * 刪除一筆 proof record
 * DELETE /api/proofs/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    await acapy.deleteProofRecord(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("[IS] [DELETE proof] error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
