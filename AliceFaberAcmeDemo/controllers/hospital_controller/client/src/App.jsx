import React from "react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";


export default function App({ children }) {
  return (
    <div style={{ fontFamily: "ui-sans-serif", padding: 16 }}>
      <header style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <h2 style={{ marginRight: "auto" }}>🏥 Hospital Controller</h2>
        <Link to="/">Dashboard</Link>
        <Link to="/connections">Connections</Link>
        <Link to="/credentialSchemas">CredentialSchemas</Link>
        <Link to="/credentialDefinitions">CredentialDefinitions</Link>
        <Link to="/credentials">Credentials</Link>
      </header>
      {children}
    </div>
  );
}
