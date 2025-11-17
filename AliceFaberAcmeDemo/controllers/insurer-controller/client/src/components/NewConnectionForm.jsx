import { useState, useRef } from "react";
import QRCode from "qrcode";

export default function NewConnectionForm({ onCreated }) {
  const [invitationObj, setInvitationObj] = useState(null);
  const [invitationUrl, setInvitationUrl] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  // textarea refs
  const invitationObjRef = useRef(null);
  const invitationUrlRef = useRef(null);

  // copy 按鈕狀態
  const [copiedObj, setCopiedObj] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const createInvitation = async () => {
    if (created) return;
    setCreating(true);

    try {
      const res = await fetch("/api/connections/create-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!data.ok) {
        console.error("❌ Failed:", data.error);
        return;
      }

      setInvitationObj(data.invitation);
      setInvitationUrl(data.invitation_url);

      const qr = await QRCode.toDataURL(data.invitation_url);
      setQrCode(qr);

      setCreated(true);
      onCreated && onCreated();
    } catch (err) {
      console.error("❌ Error:", err.message);
    } finally {
      setCreating(false);
    }
  };

  // 從 ref 複製 + 反白
  const copyFromRef = async (ref) => {
    if (!ref.current) return;
    const el = ref.current;
    const text = el.value;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      el.select();
      document.execCommand("copy");
    }

    el.focus();
    el.select();
    el.setSelectionRange(0, text.length);
  };

  // 共用 copy 按鈕 style
  const copyButtonStyle = {
    position: "absolute",
    top: "50%",
    right: "8px",
    transform: "translateY(-50%)",
    minWidth: "80px",
    height: "32px",
    borderRadius: "4px",
    border: "1px solid #d1d5db",
    backgroundColor: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "13px",
    padding: "0 6px",
    boxSizing: "border-box",
  };

  return (
    <div>
      {/* Create Invitation 按鈕 */}
      <button
        onClick={createInvitation}
        disabled={creating || created}
        style={{
          width: "100%",
          backgroundColor: created
            ? "#6b7280"
            : creating
            ? "#4b5563"
            : "#1e3a5f",
          color: "white",
          padding: "12px",
          borderRadius: "8px",
          border: "none",
          fontSize: "17px",
          cursor: creating || created ? "not-allowed" : "pointer",
          marginBottom: "20px",
          transition: "background-color 0.2s ease",
        }}
      >
        {created ? "Invitation Created" : creating ? "Creating..." : "Create Invitation"}
      </button>

      {invitationObj && (
        <div>
          {/* Invitation Object */}
          <h4>Invitation Object</h4>
          <div style={{ position: "relative", marginBottom: "12px" }}>
            <textarea
              ref={invitationObjRef}
              readOnly
              rows={10}
              value={JSON.stringify(invitationObj, null, 2)}
              style={{
                width: "100%",
                fontFamily: "monospace",
                padding: "12px",
                paddingRight: "90px", // 預留右側空間
                borderRadius: "8px",
                backgroundColor: "#f3f4f6",
                border: "1px solid #d1d5db",
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={async () => {
                await copyFromRef(invitationObjRef);
                setCopiedObj(true);
                setTimeout(() => setCopiedObj(false), 1500); // 3 秒後恢復
              }}
              style={copyButtonStyle}
              title="Copy invitation object"
            >
              {copiedObj ? "✔️ 已複製" : "📋"}
            </button>
          </div>

          {/* Invitation URL */}
          <h4 style={{ marginTop: "20px" }}>Invitation URL</h4>
          <div style={{ position: "relative", marginBottom: "8px" }}>
            <textarea
              ref={invitationUrlRef}
              readOnly
              rows={4}
              value={invitationUrl}
              style={{
                width: "100%",
                fontFamily: "monospace",
                padding: "10px",
                paddingRight: "90px",
                borderRadius: "8px",
                minHeight: "90px",
                boxSizing: "border-box",
                backgroundColor: "#f3f4f6",
                border: "1px solid #d1d5db",
              }}
            />
            <button
              type="button"
              onClick={async () => {
                await copyFromRef(invitationUrlRef);
                setCopiedUrl(true);
                setTimeout(() => setCopiedUrl(false), 1500);
              }}
              style={copyButtonStyle}
              title="Copy invitation URL"
            >
              {copiedUrl ? "✔️ 已複製" : "📋"}
            </button>
          </div>

          {/* QR Code */}
          <h4 style={{ marginTop: "20px" }}>QR Code</h4>
          <img src={qrCode} width="220" height="220" alt="QR Code" />
        </div>
      )}
    </div>
  );
}
