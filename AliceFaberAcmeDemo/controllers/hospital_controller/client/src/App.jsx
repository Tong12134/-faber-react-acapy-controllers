import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Credentials from "./pages/Credentials.jsx";
import Connections from "./pages/Connections.jsx";
import CredentialSchemas from "./pages/CredentialSchemas.jsx";
import CredentialDefinitions from "./pages/CredentialDefinitions.jsx";
import AgentStatus from "./components/AgentStatus.jsx";


export default function App() {
  return (
      <div style={{ fontFamily: "ui-sans-serif", padding: 16 }}>
        <header style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <h2 style={{ marginRight: "auto" }}>🏥 Hospital Controller</h2>
          {/* ✅ 狀態燈 */}
          <AgentStatus /> 
          
          <Link to="/">Dashboard</Link>
          <Link to="/connections">Connections</Link>
          <Link to="/credentialSchemas">Credential Schemas</Link>
          <Link to="/credentialDefinitions">Credential Definitions</Link>
          <Link to="/credentials">Credentials</Link>
        </header>

        <Routes>
          <Route path="/" element={<p>Welcome to Hospital Controller Dashboard!</p>} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/credentialSchemas" element={<CredentialSchemas />} />
          <Route path="/credentialDefinitions" element={<CredentialDefinitions />} />
          <Route path="/credentials" element={<Credentials />} />

          <Route path="*" element={<p>404 - Page Not Found</p>} />
        </Routes>
      </div>
  );
}
