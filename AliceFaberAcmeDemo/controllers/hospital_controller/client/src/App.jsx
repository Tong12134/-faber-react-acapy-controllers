import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Credentials from "./pages/Credentials.jsx";
import Connections from "./pages/Connections.jsx";
import CredentialSchemas from "./pages/CredentialSchemas.jsx";
import CredentialDefinitions from "./pages/CredentialDefinitions.jsx";
import AgentStatus from "./components/AgentStatus.jsx";

export default function App() {
  return (
    <div
      style={{
        fontFamily: "ui-sans-serif",
        padding: "0 24px",
        maxWidth: "2000px",
        margin: "0 auto",
      }}
    >
      {/* ✅ 深色標題列 */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between", // 左右分佈
          alignItems: "center",
          padding: "26px 20px",
          backgroundColor: "#1e3a5f", // ✅ 深藍標題列
          color: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          marginBottom: "25px",
        }}
      >

        <Link
          to="/"
          style={{
            color: "white",
            textDecoration: "none",
            }}
        >
          <h1
            style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: "600",
            letterSpacing: "1px",
            cursor: "pointer",
            }}
          >
            🏥 Hospital Controller
          </h1>
        </Link>

        {/* 右邊：狀態燈（不顯示文字） */}
        <AgentStatus showLabel={false} />
      </header>

      {/*  導覽按鈕列（淺色區隔） */}
      {/* ✅ 導覽按鈕列（平均分布、等寬） */}
      <nav
        style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", // ✅ 平均分佈
        gap: "20px",            // 按鈕間距
        marginBottom: "15px",
        }}
      > 
        {[
          { to: "/connections", label: "Connections" },
          { to: "/credentialSchemas", label: "Credential Schemas" },
          { to: "/credentialDefinitions", label: "Credential Definitions" },
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


      {/* ✅ 主要內容 */}
      <main style={{ marginTop: "24px" }}>
        <Routes>
          <Route
            path="/"
            element={<p style={{ fontSize: "18px", color: "#333" }}>Welcome to Hospital Controller.</p>}
          />
          <Route path="/connections" element={<Connections />} />
          <Route path="/credentialSchemas" element={<CredentialSchemas />} />
          <Route path="/credentialDefinitions" element={<CredentialDefinitions />} />
          <Route path="/credentials" element={<Credentials />} />
          <Route path="*" element={<p>404 - Page Not Found</p>} />
        </Routes>
      </main>
    </div>
  );
}
