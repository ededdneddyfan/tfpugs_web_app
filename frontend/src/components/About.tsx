import React from "react";

const About: React.FC = () => (
  <div className="container mx-auto px-4 mt-8">
    <div className="bg-gray-800 shadow-md rounded-lg p-8 max-w-3xl mx-auto text-gray-200">
      <h2 className="text-2xl font-bold mb-6">TFPugs</h2>
      <div className="space-y-4">
        <p>
          TFpugs is a discord community for playing Team Fortress Classic pickup games, we mostly play 4v4 CTF games.
        </p>
        <p>
            I'm EDEdDNEdDYFaN on discord as well as everywhere else online.
        </p>
        <div className="flex items-center space-x-2">
          <a
            href="https://bsky.app/profile/sethn.gg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 19.5h20L12 2zm0 4l6.5 11.5h-13L12 6z" />
            </svg>
            @sethn.gg
          </a>
        </div>
      </div>
    </div>
  </div>
);

export default About; 