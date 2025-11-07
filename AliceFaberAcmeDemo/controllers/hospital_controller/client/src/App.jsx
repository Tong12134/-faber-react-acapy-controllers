import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Credentials from "./pages/Credentials.jsx";
import Connections from "./pages/Connections.jsx";
import CredentialSchemas from "./pages/CredentialSchemas.jsx";
import CredentialDefinitions from "./pages/CredentialDefinitions.jsx";

export default function App() {
  return (
      <div style={{ fontFamily: "ui-sans-serif", padding: 16 }}>
        <header style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <h2 style={{ marginRight: "auto" }}>🏥 Hospital Controller</h2>
          <Link to="/">Dashboard</Link>
          <Link to="/connections">Connections</Link>
          <Link to="/credentialSchemas">Credential Schemas</Link>
          <Link to="/credentialDefinitions">Credential Definitions</Link>
          <Link to="/credentials">Credentials</Link>
        </header>

        <Routes>
          <Route path="/connections" element={<Connections />} />
          <Route path="/credentialSchemas" element={<CredentialSchemas />} />
          <Route path="/credentialDefinitions" element={<CredentialDefinitions />} />
          <Route path="/credentials" element={<Credentials />} />
        </Routes>
      </div>
  );
}
