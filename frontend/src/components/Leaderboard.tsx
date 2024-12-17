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
  is_active: boolean;
  active_rank: number | null;
  all_time_rank: number;
}

type SortField = 'active_rank' | 'all_time_rank' | 'player_name' | 'current_elo' | 'pug_wins' | 'pug_losses' | 'pug_draws' | 'win_percentage';
type SortDirection = 'asc' | 'desc';

const Leaderboard: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [sortField, setSortField] = useState<SortField>('current_elo');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedPlayers = [...(showInactive ? players : players.filter(player => player.is_active))].sort((a, b) => {
    let compareA: string | number;
    let compareB: string | number;

    switch (sortField) {
      case 'player_name':
        compareA = a.player_name.toLowerCase();
        compareB = b.player_name.toLowerCase();
        break;
      case 'active_rank':
        compareA = a.active_rank ?? Number.MAX_VALUE;
        compareB = b.active_rank ?? Number.MAX_VALUE;
        break;
      case 'win_percentage':
        compareA = (a.pug_wins / (a.pug_wins + a.pug_losses)) || 0;
        compareB = (b.pug_wins / (b.pug_wins + b.pug_losses)) || 0;
        break;
      default:
        compareA = a[sortField];
        compareB = b[sortField];
    }

    if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
    if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (field !== sortField) return <span className="text-gray-500">↕</span>;
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  if (loading) return <div className="text-center mt-4">Loading...</div>;

  return (
    <div className="container mx-auto px-4 mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Leaderboard</h2>
        <button
          onClick={() => setShowInactive(!showInactive)}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors duration-200
            ${showInactive 
              ? 'bg-gray-600 hover:bg-gray-700 text-gray-200' 
              : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
            }
          `}
        >
          {showInactive ? 'Hide Inactive Players' : 'Show Inactive Players'}
        </button>
      </div>
      <div className="bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-900 text-white">
            <tr>
              <th className="px-4 py-3 text-left w-20">
                Active Rank
              </th>
              <th className="px-4 py-3 text-left w-20">
                Overall Rank
              </th>
              <th 
                onClick={() => handleSort('player_name')}
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-800"
              >
                Player <SortIcon field="player_name" />
              </th>
              <th 
                onClick={() => handleSort('current_elo')}
                className="px-6 py-3 text-right cursor-pointer hover:bg-gray-800"
              >
                ELO <SortIcon field="current_elo" />
              </th>
              <th 
                onClick={() => handleSort('pug_wins')}
                className="px-6 py-3 text-right cursor-pointer hover:bg-gray-800"
              >
                W <SortIcon field="pug_wins" />
              </th>
              <th 
                onClick={() => handleSort('pug_losses')}
                className="px-6 py-3 text-right cursor-pointer hover:bg-gray-800"
              >
                L <SortIcon field="pug_losses" />
              </th>
              <th 
                onClick={() => handleSort('pug_draws')}
                className="px-6 py-3 text-right cursor-pointer hover:bg-gray-800"
              >
                D <SortIcon field="pug_draws" />
              </th>
              <th 
                onClick={() => handleSort('win_percentage')}
                className="px-6 py-3 text-right cursor-pointer hover:bg-gray-800"
              >
                Win % <SortIcon field="win_percentage" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {sortedPlayers.map((player) => (
              <tr 
                key={player.id} 
                className={`${
                  player.is_active 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-100' 
                    : 'bg-gray-900 hover:bg-gray-800 text-gray-500'
                }`}
              >
                <td className="px-4 py-4">{player.active_rank || '-'}</td>
                <td className="px-4 py-4">{player.all_time_rank}</td>
                <td className="px-6 py-4">
                  <Link 
                    to={`/player/${player.player_name}`}
                    className={`${
                      player.is_active 
                        ? 'text-blue-400 hover:text-blue-300' 
                        : 'text-blue-400/50 hover:text-blue-300/50'
                    }`}
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