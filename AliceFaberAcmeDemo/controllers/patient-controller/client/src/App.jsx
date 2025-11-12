import React, { useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import AgentStatus from "./components/AgentStatus.jsx";
import Connections from "./pages/Connections.jsx";
import ProofRequests from "./pages/ProofRequests.jsx";
import Credentials from "./pages/Credentials.jsx";

export default function App() {
  const location = useLocation();

  useEffect(() => {
    document.title = "Patient Controller";
  }, []);

  const isHome = location.pathname === "/";

  return (
    <div
      style={{
        fontFamily: "ui-sans-serif",
        padding: "5px 20px",
        maxWidth: "2000px",
        margin: "0 auto",
      }}
    >
      {/*  標題列（深藍滿版） */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "26px 20px",
          backgroundColor: "#1e3a5f",
          color: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          marginBottom: "25px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link
            to="/"
            style={{
              color: "white",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: "600",
                letterSpacing: "0.5px",
                cursor: "pointer",
              }}
            >
              🧑‍💻 Patient Controller
            </h1>
          </Link>
        </div>

        {/* 狀態燈 */}
        <AgentStatus showLabel={false} />
      </header>

      {/*  導航列：首頁 vs 子頁面 顯示不同樣式 */}
      {isHome ? (
        // --- 首頁導航列（滿版、等寬） ---
        <nav
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "20px",
            margin: "20px 24px",
            marginBottom: "0px",
          }}
        >
          {[
            { to: "/connections", label: "Connections" },
            { to: "/proofRequests", label: "Proof Requests" },
            { to: "/credentials", label: "Credentials" },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "48px",
                backgroundColor: "#e6f0ff",
                color: "#003366",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 500,
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "all 0.2s ease",
                fontSize: "18px",
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "#d0e0ff";
                e.target.style.transform = "scale(1.02)";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "#e6f0ff";
                e.target.style.transform = "scale(1)";
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      ) : (
        // --- 子頁面導航列（靠右小型） ---
        <nav
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "24px",
            padding: "12px 36px",
            borderBottom: "2px solid #e6f0ff",
            backgroundColor: "#f9faff",
            boxShadow: "inset 0 -1px 3px rgba(0,0,0,0.05)",
          }}
        >
          {[
            { to: "/", label: "Home" },
            { to: "/connections", label: "Connections" },
            { to: "/credentials", label: "Credentials" },
            { to: "/proofRequests", label: "Proof Requests" },
          ].map(({ to, label }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                style={{
                  color: isActive ? "#003366" : "#406080",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "15px",
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
                onMouseOver={(e) => (e.target.style.color = "#1e3a5f")}
                onMouseOut={(e) =>
                  (e.target.style.color = isActive ? "#003366" : "#406080")
                }
              >
                {label}
              </Link>
            );
          })}
        </nav>
      )}

      {/*  主內容 */}
      <main style={{ padding: "32px 40px" }}>
        <Routes>
          <Route
            path="/"
            element={
              <p
                style={{
                  fontSize: "18px",
                  color: "#333",
                }}
              >
                Welcome to Patient Controller.
              </p>
            }
          />
          <Route path="/connections" element={<Connections />} />
          <Route path="/proofRequests" element={<ProofRequests />} />
          <Route path="/credentials" element={<Credentials />} />
          <Route path="*" element={<p>404 - Page Not Found</p>} />
        </Routes>
      </main>
    </div>
  );
}
