import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { format } from 'date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';
import './MatchesTable.css';

interface Match {
  id: number;
  match_id: number | undefined;
  blue_team: string | undefined;
  red_team: string | undefined;
  winning_score: number | null;
  losing_score: number | null;
  map: string | undefined;
  server: string | undefined;
  match_outcome: number | null;
  stats_url: string | undefined;
  created_at: string;
}

interface Player {
  id: number;
  discord_id: string;
  player_name: string;
  current_elo: number;
  pug_wins: number;
  pug_losses: number;
  pug_draws: number;
  is_active: boolean;
  active_rank: number | null;
  all_time_rank: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  achievements: string;
}

interface EloHistory {
  entry_id: number;
  player_elos: number;
  created_at: string;
  match_id: number | null;  // Added this line
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin,
  annotationPlugin
);

type SortKey = 'created_at' | 'map';
type SortOrder = 'asc' | 'desc';

const PlayerMatches: React.FC = () => {
  const { playerName } = useParams<{ playerName: string }>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapFilter, setMapFilter] = useState<string>('');
  const [serverFilter, setServerFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [eloHistory, setEloHistory] = useState<EloHistory[]>([]);

  const navigate = useNavigate();
  const chartRef = useRef<ChartJS>(null);

  useEffect(() => {
    // Utility function for retrying failed requests
    const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3, delay = 500) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(url, options);
          if (response.ok) {
            return response;
          }
          console.log(`Attempt ${attempt} failed for ${url}:`, await response.text().catch(() => 'No error text'));
          
          if (attempt === maxRetries) {
            return response; // Return the failed response on last attempt
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        } catch (error) {
          console.error(`Attempt ${attempt} error for ${url}:`, error);
          if (attempt === maxRetries) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
      throw new Error('All retry attempts failed');
    };

    const fetchPlayerAndMatches = async () => {
      setLoading(true);
      try {
        const encodedName = encodeURIComponent(playerName || '');
        console.log('Making requests with:', {
          originalName: playerName,
          encodedName: encodedName
        });

        const requestOptions = {
          method: 'GET',
          mode: 'cors' as RequestMode,
          credentials: 'include' as RequestCredentials,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        };

        const baseUrl = window.location.origin;
        console.log('Base URL:', baseUrl);

        // Get player data from by-elo endpoint
        const playersResponse = await fetchWithRetry(
          `${baseUrl}/api/players/by-elo`,
          requestOptions
        );

        if (!playersResponse.ok) {
          throw new Error(`Failed to fetch players: ${await playersResponse.text()}`);
        }

        const players = await playersResponse.json();
        const player = players.find(p => p.player_name.toLowerCase() === playerName?.toLowerCase());

        if (!player) {
          throw new Error('Player not found');
        }

        // Get matches and elo history
        const response = await fetchWithRetry(
          `${baseUrl}/api/players/combined/${encodedName}`, 
          requestOptions
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch combined data: ${await response.text()}`);
        }

        const combinedData = await response.json();
        setPlayer(player);
        setMatches(combinedData.matches);
        setFilteredMatches(combinedData.matches);
        setEloHistory(combinedData.elo_history);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    fetchPlayerAndMatches();
  }, [playerName]);

  useEffect(() => {
    let filtered = matches.filter(match => {
      const matchDate = new Date(match.created_at);
      return (
        (!mapFilter || match.map === mapFilter) &&
        (!serverFilter || match.server === serverFilter) &&
        (!startDate || matchDate >= new Date(startDate)) &&
        (!endDate || matchDate <= new Date(endDate))
      );
    });

    filtered.sort((a, b) => {
      if (sortKey === 'created_at') {
        return sortOrder === 'asc' 
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortKey === 'map') {
        return sortOrder === 'asc'
          ? (a.map || '').localeCompare(b.map || '')
          : (b.map || '').localeCompare(a.map || '');
      }
      return 0;
    });

    setFilteredMatches(filtered);
  }, [matches, mapFilter, serverFilter, startDate, endDate, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const parseAchievements = (achievements: string) => {
    if (!achievements) return [];
    return achievements.split(';').map(achievement => {
      const match = achievement.match(/<:([^:]+):(\d+)>/);
      return match ? {
        name: match[1],
        emojiId: match[2]
      } : null;
    }).filter(Boolean);
  };

  const getPlayerTeam = (match: Match, playerDiscordId: string | undefined): 'blue' | 'red' => {
    if (!playerDiscordId) return 'red'; // Default to red if playerDiscordId is undefined
    const blueTeam = match.blue_team?.split(',').map(id => id.trim()) || [];
    const redTeam = match.red_team?.split(',').map(id => id.trim()) || [];
    return blueTeam.includes(playerDiscordId) ? 'blue' : 'red';
  };

  const getOutcomeClass = (match_outcome: number | null, playerTeam: 'blue' | 'red') => {
    if (match_outcome === 0) return 'draw';
    if (match_outcome === null) return 'unreported';
    if (match_outcome === 1 && playerTeam === 'blue') return 'win';
    if (match_outcome === 2 && playerTeam === 'red') return 'win';
    return 'loss';
  };

  const getOutcomeText = (match_outcome: number | null, playerTeam: 'blue' | 'red') => {
    if (match_outcome === 0) return 'Draw';
    if (match_outcome === null) return 'unreported';
    if (match_outcome === 1 && playerTeam === 'blue') return 'Win';
    if (match_outcome === 2 && playerTeam === 'red') return 'Win';
    return 'Loss';
  };

  const getScores = (match: Match) => {
    if (match.match_outcome === null) {
      return { blueScore: '-', redScore: '-' };
    }
    const blueScore = match.match_outcome === 1 ? match.winning_score : match.losing_score;
    const redScore = match.match_outcome === 2 ? match.winning_score : match.losing_score;
    return { blueScore, redScore };
  };

  const uniqueMaps = Array.from(new Set(matches.map(match => match.map).filter(Boolean)));
  const uniqueServers = Array.from(new Set(matches.map(match => match.server).filter(Boolean)));

  const downloadCSV = () => {
    const headers = ['Match ID', 'Date Played', 'Map', 'Server', 'Team', 'Blue Score', 'Red Score', 'Outcome'];
    const csvContent = [
      headers.join(','),
      ...filteredMatches.map(match => {
        const { blueScore, redScore } = getScores(match);
        const playerTeam = getPlayerTeam(match, player?.discord_id);
        const outcome = playerTeam === 'blue' ? (match.match_outcome === 1 ? 'Win' : 'Loss') : (match.match_outcome === 2 ? 'Win' : 'Loss');
        return [
          match.match_id,
          formatDate(match.created_at),
          match.map,
          match.server,
          playerTeam === 'blue' ? 'Blue' : 'Red',
          blueScore,
          redScore,
          outcome
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${playerName}_matches.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const calculateRank = (elo: number): string => {
    const RANK_BOUNDARIES_LIST = [720, 950, 1190, 1440, 1700, 1960, 2230, 2510, 2800, 3100];
    
    if (elo >= RANK_BOUNDARIES_LIST[RANK_BOUNDARIES_LIST.length - 1]) {
      return 'S';
    }
    
    for (let i = 0; i < RANK_BOUNDARIES_LIST.length; i++) {
      if (elo <= RANK_BOUNDARIES_LIST[i]) {
        return (i + 1).toString();
      }
    }
    
    return '1'; // Default for any elo below first boundary
  };

  const getRankColor = (rank: string): string => {
    switch (rank) {
      case '1':
      case '2':
      case '3':
        return 'text-green-400';
      case '4':
      case '5':
      case '6':
        return 'text-yellow-400';
      case '7':
        return 'text-orange-400';
      case '8':
        return 'text-orange-500';
      case '9':
        return 'text-orange-600';
      case '10':
        return 'text-red-500';
      case 'S':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const renderEloChart = () => {
    if (eloHistory.length === 0) {
      return <p>No ELO history available.</p>;
    }

    const sortedEloHistory = [...eloHistory].sort((a, b) => a.entry_id - b.entry_id);
    
    // Calculate average ELO
    const averageElo = sortedEloHistory.reduce((sum, entry) => sum + entry.player_elos, 0) / sortedEloHistory.length;

    const data = {
      labels: sortedEloHistory.map((_, index) => index + 1),
      datasets: [
        // Glow effect layers
        {
          label: 'ELO Glow 3',
          data: sortedEloHistory.map(entry => entry.player_elos),
          borderColor: 'rgba(0, 255, 255, 0.1)',
          backgroundColor: 'rgba(0, 255, 255, 0)',
          borderWidth: 15,
          pointRadius: 0,
          tension: 0.4,
          tooltip: {
            enabled: false
          }
        },
        {
          label: 'ELO Glow 2',
          data: sortedEloHistory.map(entry => entry.player_elos),
          borderColor: 'rgba(0, 255, 255, 0.2)',
          backgroundColor: 'rgba(0, 255, 255, 0)',
          borderWidth: 10,
          pointRadius: 0,
          tension: 0.4,
          tooltip: {
            enabled: false
          }
        },
        {
          label: 'ELO Glow 1',
          data: sortedEloHistory.map(entry => entry.player_elos),
          borderColor: 'rgba(0, 255, 255, 0.3)',
          backgroundColor: 'rgba(0, 255, 255, 0)',
          borderWidth: 5,
          pointRadius: 0,
          tension: 0.4,
          tooltip: {
            enabled: false
          }
        },
        // Main line
        {
          label: 'ELO',
          data: sortedEloHistory.map(entry => entry.player_elos),
          borderColor: 'rgba(0, 255, 255, 1)',
          backgroundColor: 'rgba(0, 255, 255, 0.3)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 8,
          tension: 0.4,
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: 'ELO History',
          color: 'rgba(255, 255, 255, 0.8)'
        },
        tooltip: {
          filter: (tooltipItem: any) => tooltipItem.datasetIndex === data.datasets.length - 1,
          callbacks: {
            title: (context: any) => `Entry ${context[0].label}`,
            label: (context: any) => `ELO: ${context.raw}`,
            afterLabel: (context: any) => {
              const entry = sortedEloHistory[context.dataIndex];
              const matchIdInfo = entry.match_id ? `Match ID: ${entry.match_id}` : 'No associated match';
              return [
                `Timestamp: ${format(new Date(entry.created_at), "yyyy-MM-dd HH:mm:ss")}`,
                matchIdInfo
              ];
            }
          }
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true
            },
            mode: 'x',
          },
          pan: {
            enabled: true,
            mode: 'x',
          },
        },
        annotation: {
          annotations: {
            averageLine: {
              type: 'line',
              yMin: averageElo,
              yMax: averageElo,
              borderColor: 'rgba(255, 255, 255, 0.5)',
              borderWidth: 2,
              borderDash: [5, 5],
              label: {
                display: true,
                content: `Average: ${averageElo.toFixed(2)}`,
                position: 'end',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'rgba(255, 255, 255, 0.8)',
                padding: 4
              }
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: 'Entry Number',
            color: 'rgba(255, 255, 255, 0.8)'
          },
          ticks: {
            stepSize: 1,
            autoSkip: true,
            maxTicksLimit: 20,
            color: 'rgba(255, 255, 255, 0.6)',
            callback: function (value: any) {
              // Skipping decimal points
              return Math.floor(value);
          }
          },
          min: 1,
          max: sortedEloHistory.length,
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'ELO',
            color: 'rgba(255, 255, 255, 0.8)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.6)'
          },
          grid: {
            display: false
          }
        }
      },
      elements: {
        point: {
          radius: (context: any) => {
            const chart = context.chart;
            const area = chart.chartArea;
            const index = context.dataIndex;
            const value = context.dataset.data[index];
            if (!area) {
              return 0;
            }
            const visiblePoints = chart.getDatasetMeta(0).data.filter(
              (point: any) => point.x >= area.left && point.x <= area.right
            );
            return visiblePoints.length < 200 ? 3 : 0;
          },
          hoverRadius: 8,
          backgroundColor: 'rgba(0, 255, 255, 1)',
          borderColor: 'rgba(0, 255, 255, 1)',
        }
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
      layout: {
        padding: 20
      },
      backgroundColor: 'black',
    };

    return (
      <div className="flex gap-8">
        <div style={{ 
          height: '400px', 
          width: '70%', 
          backgroundColor: 'black', 
          padding: '20px', 
          borderRadius: '10px',
          boxShadow: 'none',
          position: 'relative'
        }}>
          <Line data={data} options={options} ref={chartRef} />
          <div style={{
            position: 'absolute',
            top: '30px',
            right: '40px'
          }}>
            <button 
              onClick={resetZoom} 
              className="px-2 py-1 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 text-sm"
            >
              Reset Zoom
            </button>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 w-[30%] h-[450px]">
          <table className="w-full text-gray-200">
            <tbody>
              <tr className="border-b border-gray-700">
                <td className="py-2 text-gray-400">Current ELO</td>
                <td className="py-2 text-right">{player?.current_elo}</td>
              </tr>
              <tr className="border-b border-gray-700">
                <td className="py-2 text-gray-400">Visual Rank</td>
                <td className="py-2 text-right">
                  <span className={`font-bold ${player ? getRankColor(calculateRank(player.current_elo)) : 'text-gray-400'}`}>
                    {player ? calculateRank(player.current_elo) : '-'}
                  </span>
                </td>
              </tr>
              <tr className="border-b border-gray-700">
                <td className="py-2 text-gray-400">Active Rank</td>
                <td className="py-2 text-right">{player?.active_rank || '-'}</td>
              </tr>
              <tr className="border-b border-gray-700">
                <td className="py-2 text-gray-400">All-time Rank</td>
                <td className="py-2 text-right">{player?.all_time_rank}</td>
              </tr>
              <tr className="border-b border-gray-700">
                <td className="py-2 text-gray-400">Status</td>
                <td className="py-2 text-right">
                  <span className={`px-2 py-1 rounded ${player?.is_active ? 'bg-green-500' : 'bg-gray-500'}`}>
                    {player?.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
              <tr className="border-b border-gray-700">
                <td className="py-2 text-gray-400">Wins</td>
                <td className="py-2 text-right text-green-400">{player?.pug_wins}</td>
              </tr>
              <tr className="border-b border-gray-700">
                <td className="py-2 text-gray-400">Losses</td>
                <td className="py-2 text-right text-red-400">{player?.pug_losses}</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-400">Draws</td>
                <td className="py-2 text-right text-gray-400">{player?.pug_draws}</td>
              </tr>
              <tr className="border-b border-gray-700">
                <td className="py-2 text-gray-400">Achievements</td>
                <td className="py-2 text-right">
                  <div className="grid grid-cols-5 gap-1 justify-items-center">
                    {player?.achievements && parseAchievements(player.achievements).map((achievement, index) => (
                      <img
                        key={index}
                        src={`https://cdn.discordapp.com/emojis/${achievement.emojiId}.webp`}
                        alt={achievement.name}
                        title={achievement.name}
                        className="w-6 h-6"
                      />
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  if (loading) return <p className="loading">Loading player data...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="matches-container">
      <h3 className="matches-title">Summary for {playerName}</h3>
      <Link to="/" className="back-button">Back to All Matches</Link>
      
      {/* ELO History Chart */}
      <div className="elo-chart-container">
        {renderEloChart()}
      </div>

      <div className="filters">
        <div className="filter-group">
          <select value={mapFilter} onChange={(e) => setMapFilter(e.target.value)}>
            <option value="">All Maps</option>
            {uniqueMaps.map(map => (
              <option key={map} value={map}>{map}</option>
            ))}
          </select>
          <select value={serverFilter} onChange={(e) => setServerFilter(e.target.value)}>
            <option value="">All Servers</option>
            {uniqueServers.map(server => (
              <option key={server} value={server}>{server}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>
            Date Range:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
            />
          </label>
        </div>
        <button onClick={downloadCSV} className="download-csv">Download CSV</button>
      </div>
      <div className="matches-table-wrapper">
        <table className="matches-table">
          <thead>
            <tr>
              <th>Match ID</th>
              <th onClick={() => handleSort('created_at')} className="sortable">
                Date Played {sortKey === 'created_at' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              <th onClick={() => handleSort('map')} className="sortable">
                Map {sortKey === 'map' && (sortOrder === 'asc' ? '▲' : '▼')}
              </th>
              <th>Server</th>
              <th>Team</th>
              <th>Score</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {filteredMatches.map(match => {
              const { blueScore, redScore } = getScores(match);
              const playerTeam = getPlayerTeam(match, player?.discord_id);
              return (
                <tr key={match.id} className={getOutcomeClass(match.match_outcome, playerTeam)}>
                  <td>
                    {match.stats_url ? (
                      <a href={match.stats_url} target="_blank" rel="noopener noreferrer" className="match-id-link">
                        {match.match_id}
                      </a>
                    ) : (
                      match.match_id
                    )}
                  </td>
                  <td>{formatDate(match.created_at)}</td>
                  <td>{match.map}</td>
                  <td>{match.server}</td>
                  <td>{playerTeam === 'blue' ? 'Blue' : 'Red'}</td>
                  <td>
                    <div className="score">
                      <span className="blue-score">{blueScore}</span>
                      <span className="score-separator">:</span>
                      <span className="red-score">{redScore}</span>
                    </div>
                  </td>
                  <td>{getOutcomeText(match.match_outcome, playerTeam)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlayerMatches;