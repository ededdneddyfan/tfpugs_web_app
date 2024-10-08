import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MatchesTable from "./components/MatchesTable";
import PlayerMatches from "./components/PlayerMatches";

import "./index.css";

const App: React.FC = () => {
  return (
    <Router>
      <h2 style={{ textAlign: 'center' }}>
        <a href="https://discord.gg/tfpugs" target="_blank" rel="noopener noreferrer">
          discord.gg/tfpugs
        </a>
      </h2>
      <Routes>
        <Route path="/" element={<MatchesTable />} />
        <Route path="/player/:playerName" element={<PlayerMatches />} />
      </Routes>
    </Router>
  );
};

const root = document.getElementById("root");

if (!root) {
  throw new Error("No root element found");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);