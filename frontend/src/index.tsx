import React from "react";
import ReactDOM from "react-dom/client";
import { LocoSplash } from "./LocoSplash";
import MatchesTable from "./components/MatchesTable";

import "./index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("No root element found");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <h2>TFPugs</h2>
    <MatchesTable />
  </React.StrictMode>,
);