import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import MatchesTable from "./components/MatchesTable";
import PlayerMatches from "./components/PlayerMatches";

import "./index.css";

const Navigation: React.FC = () => {
  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center justify-center flex-1">
            <div className="flex space-x-8">
              <Link 
                to="/" 
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Matches
              </Link>
              <Link 
                to="/leaderboard" 
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Leaderboard
              </Link>
              <Link 
                to="/about" 
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                About
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Stub components for new routes
const Leaderboard: React.FC = () => <div>Leaderboard Coming Soon!</div>;
const About: React.FC = () => <div>About Page Coming Soon!</div>;

const App: React.FC = () => {
  return (
    <Router>
      <Navigation />
      <div className="flex justify-center my-4">
        <iframe 
          src="https://discord.com/widget?id=836006501595742238&theme=dark" 
          width="350" 
          height="200" 
          allowTransparency="true" 
          frameBorder="0" 
          sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        ></iframe>
      </div>
      <Routes>
        <Route path="/" element={<MatchesTable />} />
        <Route path="/player/:playerName" element={<PlayerMatches />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/about" element={<About />} />
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