import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { format } from 'date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
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
  // Add other player fields as needed
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
  zoomPlugin
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
    const fetchPlayerAndMatches = async () => {
      setLoading(true);
      try {
        const [playerResponse, matchesResponse, eloHistoryResponse] = await Promise.all([
          fetch(`/api/players/name/${encodeURIComponent(playerName || '')}`),
          fetch(`/api/matches/player/${encodeURIComponent(playerName || '')}`),
          fetch(`/api/player_elo/${encodeURIComponent(playerName || '')}`)
        ]);

        if (!playerResponse.ok || !matchesResponse.ok || !eloHistoryResponse.ok) {
          throw new Error('Failed to fetch player data, matches, or ELO history');
        }

        const playerData = await playerResponse.json();
        const matchesData = await matchesResponse.json();
        const eloHistoryData = await eloHistoryResponse.json();

        setPlayer(playerData);
        setMatches(matchesData);
        setFilteredMatches(matchesData);
        setEloHistory(eloHistoryData);
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

  const renderEloChart = () => {
    if (eloHistory.length === 0) {
      return <p>No ELO history available.</p>;
    }

    const sortedEloHistory = [...eloHistory].sort((a, b) => a.entry_id - b.entry_id);

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
          display: false, // Hide the legend as we don't need it for the glow effect layers
        },
        title: {
          display: true,
          text: 'ELO History',
          color: 'rgba(255, 255, 255, 0.8)' // Light text color for dark background
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
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: 'Entry Number',
            color: 'rgba(255, 255, 255, 0.8)' // Light text color for dark background
          },
          ticks: {
            stepSize: 1,
            autoSkip: true,
            maxTicksLimit: 20,
            color: 'rgba(255, 255, 255, 0.6)', // Light text color for dark background
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
            color: 'rgba(255, 255, 255, 0.8)' // Light text color for dark background
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.6)' // Light text color for dark background
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
      <div style={{ 
        height: '400px', 
        width: '100%', 
        backgroundColor: 'black', 
        padding: '20px', 
        borderRadius: '10px',
        boxShadow: 'none',
        position: 'relative'  // Add this to allow absolute positioning of children
      }}>
        <Line data={data} options={options} ref={chartRef} />
        <div className="chart-controls">
          <button onClick={resetZoom} className="reset-zoom-button">Reset Zoom</button>
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
      <h3 className="matches-title">Match History for {playerName}</h3>
      <h2 className="current-elo">Current ELO: {player ? player.current_elo : 'N/A'}</h2>
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