import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Credentials from "./pages/Credentials.jsx";
import Connections from "./pages/Connections.jsx";
import CredentialSchemas from "./pages/CredentialSchemas.jsx";
import CredentialDefinitions from "./pages/CredentialDefinitions.jsx";
import AgentStatus from "./components/AgentStatus.jsx";

export default function App() {
  return (
    <div style={{ fontFamily: "ui-sans-serif", padding: "24px"}}>
      {/* ✅ 標題列 */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between", // 左右分佈：標題在左、燈在右
          alignItems: "center",             // 垂直置中對齊
          padding: "25px 25px",            // 內距，讓底色有呼吸空間
          backgroundColor: "#f0f6ff",      // ✅ 底色：淡藍灰
          borderRadius: "8px",             // 圓角
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)", // 微陰影
          marginBottom: "30px",
        }}
      >
        {/* 左邊：標題 */}
        <h1 style={{ margin: 0, fontSize: "36px" }}>🏥 Hospital Controller</h1>

        {/* 右邊：狀態燈（不顯示文字） */}
        <AgentStatus showLabel={false} />
      </header>

      {/* ✅ 導覽按鈕列 */}
      <nav
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "35px",
          marginBottom: "25px",
        }}
      >
        {[
          { to: "/", label: "Dashboard" },
          { to: "/connections", label: "Connections" },
          { to: "/credentialSchemas", label: "Credential Schemas" },
          { to: "/credentialDefinitions", label: "Credential Definitions" },
          { to: "/credentials", label: "Credentials" },
        ].map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            style={{
              padding: "15px 26px",
              backgroundColor: "#e6f0ff",
              color: "#003366",
              borderRadius: "8px",
              textDecoration: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#d0e0ff")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#e6f0ff")}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* ✅ 主要內容 */}
      <main style={{ marginTop: "29px" }}>
        <Routes>
          <Route path="/" element={<p>Welcome to Hospital Controller Dashboard!</p>} />
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
