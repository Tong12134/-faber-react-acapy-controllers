import React, { useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import AgentStatus from "./components/AgentStatus.jsx";
import Connections from "./pages/Connections.jsx";
import CredentialSchemas from "./pages/CredentialSchemas.jsx";
import CredentialDefinitions from "./pages/CredentialDefinitions.jsx";
import Credentials from "./pages/Credentials.jsx";
import ProofRequests from "./pages/ProofRequests.jsx";
import Claims from "./pages/Claims.jsx";

export default function App() {
  const location = useLocation();

  useEffect(() => {
    document.title = "Insurer Controller";
  }, []);

  const isHome = location.pathname === "/";

  const navItems = [
    { to: "/connections", label: "Connections" },
    { to: "/credentialSchemas", label: "Schemas" },
    { to: "/credentialDefinitions", label: "Definitions" },
    { to: "/credentials", label: "Credentials" },
    { to: "/proofRequests", label: "Proofs" },
    { to: "/claims", label: "Claims" },
  ];

  return (
    <div
      style={{
        fontFamily:
          "'SF Pro Display', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
      }}
    >
      {/* 頂部導航 */}
      <header
        style={{
          backgroundColor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "1600px",
            margin: "0 auto",
            padding: "26px 64px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link
            to="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "18px",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                background:
                  "radial-gradient(circle at 30% 30%, #0f172a, #1e293b 55%, #020617)",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: "700",
                color: "white",
                boxShadow: "0 18px 32px rgba(15,23,42,0.45)",
              }}
            >
              I
            </div>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "32px",
                  lineHeight: "1.05",
                  fontWeight: 750,
                  color: "#0f172a",
                  letterSpacing: "-0.6px",
                }}
              >
                Insurer
              </h1>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "13px",
                  color: "#94a3b8",
                }}
              >
                Identity & Claims Console
              </p>
            </div>
          </Link>

          <AgentStatus showLabel={false} />
        </div>
      </header>

      {/* 子頁面導航（首頁不顯示） */}
      {!isHome && (
        <nav
          style={{
            backgroundColor: "white",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              maxWidth: "1600px",
              margin: "0 auto",
              padding: "8px 48px 10px",
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* 左側簡單 breadcrumb */}
            <div
              style={{
                fontSize: "12px",
                color: "#94a3b8",
              }}
            >
              <Link
                to="/"
                style={{
                  color: "#64748b",
                  textDecoration: "none",
                }}
              >
                Home
              </Link>{" "}
              <span style={{ margin: "0 4px" }}>›</span>
              <span style={{ color: "#0f172a" }}>
                {navItems.find((n) => n.to === location.pathname)?.label ||
                  "Page"}
              </span>
            </div>

            {/* 右側多列 pill 導覽 */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                justifyContent: "flex-end",
              }}
            >
              {navItems.map(({ to, label }) => {
                const isActive = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        padding: "6px 14px",
                        borderRadius: "999px",
                        fontSize: "13px",
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "#0f172a" : "#64748b",
                        backgroundColor: isActive ? "#e0f2fe" : "#f8fafc",
                        border: isActive
                          ? "1px solid #0ea5e9"
                          : "1px solid #e2e8f0",
                        boxShadow: isActive
                          ? "0 4px 10px rgba(56,189,248,0.35)"
                          : "none",
                        cursor: "pointer",
                        transition:
                          "background-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isActive
                          ? "#dbeafe"
                          : "#e5f2ff";
                        e.currentTarget.style.borderColor = "#0ea5e9";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isActive
                          ? "#e0f2fe"
                          : "#f8fafc";
                        e.currentTarget.style.borderColor = isActive
                          ? "#0ea5e9"
                          : "#e2e8f0";
                      }}
                    >
                      {label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* 主內容 */}
      <main
        style={{
          maxWidth: "1600px",
          margin: "0 auto",
          padding: isHome ? "56px 48px 64px" : "40px 48px 64px",
        }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <div>
                {/* 歡迎標題 */}
                <div style={{ marginBottom: "48px" }}>
                  <h2
                    style={{
                      fontSize: "40px",
                      fontWeight: 700,
                      color: "#0f172a",
                      margin: "0 0 14px 0",
                      letterSpacing: "-0.8px",
                    }}
                  >
                    Welcome back 
                  </h2>
                  <p
                    style={{
                      fontSize: "16px",
                      color: "#64748b",
                      margin: 0,
                      // maxWidth: "520px",
                      lineHeight: 1.7,
                    }}
                  >
                    Manage your verifiable credentials, proof flows, and
                    insurance claim automation from a single place.
                  </p>
                </div>

                {/* 功能卡片 */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: "24px",
                  }}
                >
                  {[
                    {
                      to: "/connections",
                      label: "Connections",
                      desc: "建立與管理安全的點對點連線",
                      color: "#3b82f6",
                    },
                    {
                      to: "/credentialSchemas",
                      label: "Credential Schemas",
                      desc: "定義憑證的資料結構與屬性",
                      color: "#8b5cf6",
                    },
                    {
                      to: "/credentialDefinitions",
                      label: "Credential Definitions",
                      desc: "創建憑證定義與發行金鑰",
                      color: "#06b6d4",
                    },
                    {
                      to: "/credentials",
                      label: "Issued Credentials",
                      desc: " 發保險憑證與其狀態",
                      color: "#10b981",
                    },
                    {
                      to: "/proofRequests",
                      label: "Proof Requests",
                      desc: "驗證用戶提供的證明資料",
                      color: "#f59e0b",
                    },
                    {
                      to: "/claims",
                      label: "Claims Management",
                      desc: "審核與處理保險理賠申請",
                      color: "#ef4444",
                      highlight: true,
                    },
                  ].map(({ to, label, desc, color, highlight }) => (
                    <Link key={to} to={to} style={{ textDecoration: "none" }}>
                      <div
                        style={{
                          backgroundColor: "white",
                          borderRadius: "18px",
                          padding: "22px 22px 20px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 10px 22px rgba(148,163,184,0.18)",
                          transition:
                            "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
                          position: "relative",
                          overflow: "hidden",
                          cursor: "pointer",
                          boxSizing: "border-box",
                        }}
                        onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-3px)";
                        e.currentTarget.style.boxShadow =
                          "0 14px 26px rgba(148,163,184,0.24)";   // 不再分 highlight
                        e.currentTarget.style.borderColor = color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 10px 22px rgba(148,163,184,0.18)";   // 同上
                        e.currentTarget.style.borderColor = "#e2e8f0";
                      }}
                      >
                        {/* 上方彩色細線 */}
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: "3px",
                            backgroundColor: color,
                          }}
                        />

                        <h3
                          style={{
                            fontSize: "18px",
                            fontWeight: 600,
                            color: "#0f172a",
                            margin: "6px 0 6px 0",
                          }}
                        >
                          {label}
                        </h3>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#64748b",
                            margin: 0,
                            lineHeight: 1.6,
                          }}
                        >
                          {desc}
                        </p>
                        <div
                          style={{
                            marginTop: "18px",
                            fontSize: "18px",
                            color: color,
                          }}
                        >
                          →
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            }
          />
          <Route path="/connections" element={<Connections />} />
          <Route path="/credentialSchemas" element={<CredentialSchemas />} />
          <Route
            path="/credentialDefinitions"
            element={<CredentialDefinitions />}
          />
          <Route path="/credentials" element={<Credentials />} />
          <Route path="/proofRequests" element={<ProofRequests />} />
          <Route path="/claims" element={<Claims />} />
          <Route
            path="*"
            element={
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <h2
                  style={{
                    fontSize: "64px",
                    margin: "0 0 12px 0",
                    color: "#0f172a",
                  }}
                >
                  404
                </h2>
                <p style={{ fontSize: "16px", color: "#64748b" }}>
                  Page Not Found
                </p>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
