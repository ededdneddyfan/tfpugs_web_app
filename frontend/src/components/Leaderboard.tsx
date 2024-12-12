import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface Player {
  id: number;
  player_name: string;
  current_elo: number;
  discord_id: string;
  pug_wins: number;
  pug_losses: number;
  pug_draws: number;
}

const Leaderboard: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/players/by-elo')
      .then(response => response.json())
      .then(data => {
        setPlayers(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching leaderboard:', error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center mt-4">Loading...</div>;

  return (
    <div className="container mx-auto px-4 mt-8">
      <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
      <div className="bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-900 text-white">
            <tr>
              <th className="px-6 py-3 text-left">Rank</th>
              <th className="px-6 py-3 text-left">Player</th>
              <th className="px-6 py-3 text-right">ELO</th>
              <th className="px-6 py-3 text-right">W</th>
              <th className="px-6 py-3 text-right">L</th>
              <th className="px-6 py-3 text-right">D</th>
              <th className="px-6 py-3 text-right">Win %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {players.map((player, index) => (
              <tr key={player.id} className="bg-gray-800 hover:bg-gray-700 text-gray-200">
                <td className="px-6 py-4">{index + 1}</td>
                <td className="px-6 py-4">
                  <Link 
                    to={`/player/${player.player_name}`}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {player.player_name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-right">{player.current_elo}</td>
                <td className="px-6 py-4 text-right text-green-400">{player.pug_wins}</td>
                <td className="px-6 py-4 text-right text-red-400">{player.pug_losses}</td>
                <td className="px-6 py-4 text-right text-gray-400">{player.pug_draws}</td>
                <td className="px-6 py-4 text-right">
                  {((player.pug_wins / (player.pug_wins + player.pug_losses)) * 100 || 0).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard; 