import React from "react";
import ReactDOM from "react-dom/client";
import posthog from 'posthog-js';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import MatchesTable from "./components/MatchesTable";
import PlayerMatches from "./components/PlayerMatches";
import Leaderboard from "./components/Leaderboard";
import About from "./components/About";
import pugsLogo from "./assets/PUGSLOGO.png";
import "./index.css";

// Initialize PostHog at the top of the file, before any components
posthog.init(
  process.env.VITE_PUBLIC_POSTHOG_KEY || '',
  {
    api_host: process.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    }
  }
);

const Navigation: React.FC = () => {
  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center h-16">
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
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-center">
          <img 
            src={pugsLogo}
            alt="PUGS Logo" 
            className="w-1/2"
          />
        </div>
      </div>
      <Navigation />
      <div className="flex justify-center my-4">
        <iframe 
          src="https://discord.com/widget?id=836006501595742238&theme=dark" 
          width="350" 
          height="250" 
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