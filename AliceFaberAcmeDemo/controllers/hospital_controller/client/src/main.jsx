import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import App from "./App.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Connections from "./pages/Connections.jsx";
import CredentialSchemas from "./pages/CredentialSchemas.jsx";
import CredentialDefinitions from "./pages/CredentialDefinitions.jsx";
import Credentials from "./pages/Credentials.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/connections" element={<Connections />} />
        <Route path="/credentialSchemas" element={<CredentialSchemas />} />
        <Route path="/credentialDefinitions" element={<CredentialDefinitions />} />
        <Route path="/credentials" element={<Credentials />} />
      </Routes>
    </App>
  </BrowserRouter>
);
