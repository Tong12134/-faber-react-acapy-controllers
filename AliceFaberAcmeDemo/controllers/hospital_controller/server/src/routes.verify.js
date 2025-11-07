import acapy from "./acapy.js";
import express from "express";

const router = express.Router();

/**
 * 發起 Proof Request（示例）
 * body: { connection_id }
 */
router.post("/request", async (req, res, next) => {
  try {
    const { connection_id } = req.body;

    const payload = {
      connection_id,
      comment: "Please prove you have a hospital diagnostic credential",
      presentation_request: {
        indy: {
          name: "diagnostic_proof",
          version: "1.0",
          requested_attributes: {
            attr1_referent: {
              name: "diagnosis",
              restrictions: [
                { cred_def_id: "NcYxiDXkpYi6ov5FcYDi1e:3:CL:20:tag" } // 對應上面 issue 用的 cred_def
              ]
            }
          },
          requested_predicates: {}
        }
      }
    };

    const r = await acapy.post("/present-proof-2.0/send-request", payload);
    res.json(r.data);
  } catch (e) {
    next(e);
  }
});

export default router;
