import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import './MatchesTable.css';

interface Player {
  id: number;
  discord_id: string;
  player_name: string;
  // Add other player fields as needed
}

interface Match {
  id: number;
  match_id: number | null;
  blue_team: string | null;
  red_team: string | null;
  winning_score: number | null;
  losing_score: number | null;
  map: string | null;
  server: string | null;
  match_outcome: number | null;
  stats_url: string | null;
  created_at: string;
}

type SortKey = 'created_at' | 'map';
type SortOrder = 'asc' | 'desc';
const MatchesTable: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapFilter, setMapFilter] = useState<string>('');
  const [serverFilter, setServerFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [playerSearch, setPlayerSearch] = useState<string>('');
  const [fuse, setFuse] = useState<Fuse<Player> | null>(null);
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const handlePlayerClick = (playerName: string) => {
    navigate(`/player/${encodeURIComponent(playerName)}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [matchesResponse, playersResponse] = await Promise.all([
          fetch('/api/matches'),
          fetch('/api/players')
        ]);

        if (!matchesResponse.ok || !playersResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const matchesData = await matchesResponse.json();
        const playersData = await playersResponse.json();

        setMatches(matchesData);
        setFilteredMatches(matchesData);
        
        const playersMap: Record<string, Player> = {};
        playersData.forEach((player: Player) => {
          playersMap[player.discord_id] = player;
        });
        setPlayers(playersMap);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (Object.keys(players).length > 0) {
      const fuseOptions = {
        keys: ['player_name'],
        threshold: 0.3,
      };
      setFuse(new Fuse(Object.values(players), fuseOptions));
    }
  }, [players]);

  useEffect(() => {
    let filtered = matches.filter(match => {
      const matchDate = new Date(match.created_at);
      const matchPlayers = [...getTeamPlayers(match.blue_team), ...getTeamPlayers(match.red_team)];
      return (
        (!mapFilter || match.map === mapFilter) &&
        (!serverFilter || match.server === serverFilter) &&
        (!startDate || matchDate >= new Date(startDate)) &&
        (!endDate || matchDate <= new Date(endDate)) &&
        (!playerSearch || matchPlayers.some(player => 
          fuse?.search(playerSearch).some(result => result.item.player_name === player)
        ))
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
  }, [matches, mapFilter, serverFilter, startDate, endDate, sortKey, sortOrder, playerSearch, fuse]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const getTeamPlayers = (teamString: string | null) => {
    if (!teamString) return [];
    const discordIds = teamString.split(',').map(id => id.trim());
    return discordIds.map(id => players[id]?.player_name || id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getOutcomeClass = (outcome: number | null) => {
    if (outcome === 1) return 'blue-win';
    if (outcome === 2) return 'red-win';
    return 'draw';
  };

  const getOutcomeText = (outcome: number | null) => {
    if (outcome === 1) return 'Blue Win';
    if (outcome === 2) return 'Red Win';
    return 'Draw';
  };

  const getScores = (match: Match) => {
    const blueScore = match.match_outcome === 1 ? match.winning_score : match.losing_score;
    const redScore = match.match_outcome === 2 ? match.winning_score : match.losing_score;
    return { blueScore, redScore };
  };

  const uniqueMaps = Array.from(new Set(matches.map(match => match.map).filter(Boolean)));
  const uniqueServers = Array.from(new Set(matches.map(match => match.server).filter(Boolean)));

  const downloadCSV = () => {
    const headers = ['Match ID', 'Date Played', 'Map', 'Server', 'Blue Team', 'Red Team', 'Blue Score', 'Red Score', 'Outcome'];
    const csvContent = [
      headers.join(','),
      ...filteredMatches.map(match => {
        const { blueScore, redScore } = getScores(match);
        return [
          match.match_id,
          formatDate(match.created_at),
          match.map,
          match.server,
          getTeamPlayers(match.blue_team).join('; '),
          getTeamPlayers(match.red_team).join('; '),
          blueScore,
          redScore,
          getOutcomeText(match.match_outcome)
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'matches.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePlayerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setPlayerSearch(searchTerm);

    if (searchTerm && fuse) {
      const results = fuse.search(searchTerm).slice(0, 5); // Limit to top 5 results
      setSearchResults(results.map(result => result.item));
    } else {
      setSearchResults([]);
    }
  };

  const handlePlayerSelect = (playerName: string) => {
    setPlayerSearch('');
    setSearchResults([]);
    navigate(`/player/${encodeURIComponent(playerName)}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) return <p className="loading">Loading matches...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="matches-container">
      <h3 className="matches-title">4v4 Matches</h3>
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
          <div className="player-search-container" ref={searchRef}>
            <input
              type="text"
              value={playerSearch}
              onChange={handlePlayerSearch}
              placeholder="Search players..."
              className="player-search"
            />
            {searchResults.length > 0 && (
              <ul className="search-results">
                {searchResults.map((player) => (
                  <li
                    key={player.id}
                    onClick={() => handlePlayerSelect(player.player_name)}
                  >
                    <span className="player-name">{player.player_name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
              <th>Teams</th>
              <th>Score</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {filteredMatches.map(match => {
              const { blueScore, redScore } = getScores(match);
              return (
                <tr key={match.id} className={getOutcomeClass(match.match_outcome)}>
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
                  <td>
                    <div className="teams">
                      <div className="blue-team">
                        {getTeamPlayers(match.blue_team).map((player, index) => (
                          <span 
                            key={index} 
                            className="player-name clickable" 
                            onClick={() => handlePlayerClick(player)}
                          >
                            {player}
                          </span>
                        ))}
                      </div>
                      <span className="vs">vs</span>
                      <div className="red-team">
                        {getTeamPlayers(match.red_team).map((player, index) => (
                          <span 
                            key={index} 
                            className="player-name clickable" 
                            onClick={() => handlePlayerClick(player)}
                          >
                            {player}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="score">
                      <span className="blue-score">{blueScore}</span>
                      <span className="score-separator">:</span>
                      <span className="red-score">{redScore}</span>
                    </div>
                  </td>
                  <td>{getOutcomeText(match.match_outcome)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MatchesTable;