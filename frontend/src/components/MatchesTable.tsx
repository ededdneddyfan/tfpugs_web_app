import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import './MatchesTable.css';

interface Player {
  id: number;
  discord_id: string;
  player_name: string;
  current_elo: number;
}

interface Match {
  match_data: {
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
  };
  blue_team_players: Player[];
  red_team_players: Player[];
}

type SortKey = 'created_at' | 'map';
type SortOrder = 'asc' | 'desc';

interface PaginatedResponse {
  data: Match[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

const MatchesTable: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapFilter, setMapFilter] = useState<string>('');
  const [serverFilter, setServerFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [playerSearch, setPlayerSearch] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMatches, setTotalMatches] = useState(0);
  const [pageInput, setPageInput] = useState<string>('1');

  const navigate = useNavigate();

  useEffect(() => {
    if (playerSearch) {
      const allPlayers = new Map<number, Player>();
      matches.forEach(match => {
        [...match.blue_team_players, ...match.red_team_players].forEach(player => {
          allPlayers.set(player.id, player);
        });
      });
      
      const uniquePlayers = Array.from(allPlayers.values());
      const results = uniquePlayers
        .filter(player => 
          player.player_name.toLowerCase().includes(playerSearch.toLowerCase())
        )
        .slice(0, 5); // Limit to top 5 results
      
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [playerSearch, matches]);

  const handlePlayerClick = (playerName: string) => {
    navigate(`/player/${encodeURIComponent(playerName)}`);
  };

  const handlePlayerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerSearch(e.target.value);
  };

  const handlePlayerSelect = (playerName: string) => {
    setPlayerSearch('');
    setSearchResults([]);
    navigate(`/player/${encodeURIComponent(playerName)}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const matchesResponse = await fetch(
          `/api/matches/with-players?page=${page}&per_page=${perPage}`
        );

        if (!matchesResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const paginatedData: PaginatedResponse = await matchesResponse.json();
        setMatches(paginatedData.data);
        setFilteredMatches(paginatedData.data);
        setTotalPages(paginatedData.total_pages);
        setTotalMatches(paginatedData.total);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [page, perPage]);

  useEffect(() => {
    let filtered = matches.filter(match => {
      const matchDate = new Date(match.match_data.created_at);
      const matchPlayers = [...match.blue_team_players, ...match.red_team_players];
      return (
        (!mapFilter || match.match_data.map === mapFilter) &&
        (!serverFilter || match.match_data.server === serverFilter) &&
        (!startDate || matchDate >= new Date(startDate)) &&
        (!endDate || matchDate <= new Date(endDate)) &&
        (!playerSearch || matchPlayers.some(player => 
          player.player_name.toLowerCase().includes(playerSearch.toLowerCase())
        ))
      );
    });

    filtered.sort((a, b) => {
      if (sortKey === 'created_at') {
        return sortOrder === 'asc' 
          ? new Date(a.match_data.created_at).getTime() - new Date(b.match_data.created_at).getTime()
          : new Date(b.match_data.created_at).getTime() - new Date(a.match_data.created_at).getTime();
      } else if (sortKey === 'map') {
        return sortOrder === 'asc'
          ? (a.match_data.map || '').localeCompare(b.match_data.map || '')
          : (b.match_data.map || '').localeCompare(a.match_data.map || '');
      }
      return 0;
    });

    setFilteredMatches(filtered);
  }, [matches, mapFilter, serverFilter, startDate, endDate, sortKey, sortOrder, playerSearch]);

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

  const getOutcomeClass = (outcome: number | null) => {
    if (outcome === 1) return 'blue-win';
    if (outcome === 2) return 'red-win';
    if (outcome === null) return 'unreported';
    return 'draw';
  };

  const getOutcomeText = (outcome: number | null) => {
    if (outcome === 1) return 'Blue Win';
    if (outcome === 2) return 'Red Win';
    if (outcome === null) return 'Unreported';
    return 'Draw';
  };

  const getScores = (matchData: Match['match_data']) => {
    if (matchData.match_outcome === null) {
      return { blueScore: '-', redScore: '-' };
    }
    const blueScore = matchData.match_outcome === 1 ? matchData.winning_score : matchData.losing_score;
    const redScore = matchData.match_outcome === 2 ? matchData.winning_score : matchData.losing_score;
    return { blueScore, redScore };
  };
  
  const uniqueMaps = Array.from(new Set(matches.map(match => match.match_data.map).filter(Boolean)));
  const uniqueServers = Array.from(new Set(matches.map(match => match.match_data.server).filter(Boolean)));

  const downloadCSV = () => {
    const headers = ['Match ID', 'Date Played', 'Map', 'Server', 'Blue Team', 'Red Team', 'Blue Score', 'Red Score', 'Outcome'];
    const csvContent = [
      headers.join(','),
      ...filteredMatches.map(match => {
        const { blueScore, redScore } = getScores(match.match_data);
        return [
          match.match_data.match_id,
          formatDate(match.match_data.created_at),
          match.match_data.map,
          match.match_data.server,
          match.blue_team_players.map(p => p.player_name).join('; '),
          match.red_team_players.map(p => p.player_name).join('; '),
          blueScore,
          redScore,
          getOutcomeText(match.match_data.match_outcome)
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

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPageInput(value);
  };

  const handlePageInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const newPage = parseInt(pageInput);
      if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
      } else {
        setPageInput(page.toString()); // Reset to current page if invalid
      }
    }
  };

  // Update pageInput when page changes
  useEffect(() => {
    setPageInput(page.toString());
  }, [page]);

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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Rows per page:</span>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="bg-gray-700 text-gray-200 rounded px-2 py-1"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={totalMatches}>All</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-700 text-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="First Page"
          >
            ««
          </button>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-700 text-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous Page"
          >
            «
          </button>
          <span className="text-gray-400">Page</span>
          <input
            type="text"
            value={pageInput}
            onChange={handlePageInputChange}
            onKeyDown={handlePageInputSubmit}
            className="w-16 px-2 py-1 bg-gray-700 text-gray-200 rounded text-center"
            aria-label="Page number"
          />
          <span className="text-gray-400">of {totalPages}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 bg-gray-700 text-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next Page"
          >
            »
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="px-3 py-1 bg-gray-700 text-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Last Page"
          >
            »»
          </button>
        </div>
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
              const { blueScore, redScore } = getScores(match.match_data);
              return (
                <tr key={match.match_data.id} className={getOutcomeClass(match.match_data.match_outcome)}>
                  <td>
                    {match.match_data.stats_url ? (
                      <a href={match.match_data.stats_url} target="_blank" rel="noopener noreferrer" className="match-id-link">
                        {match.match_data.match_id}
                      </a>
                    ) : (
                      match.match_data.match_id
                    )}
                  </td>
                  <td>{formatDate(match.match_data.created_at)}</td>
                  <td>{match.match_data.map}</td>
                  <td>{match.match_data.server}</td>
                  <td>
                    <div className="teams">
                      <div className="blue-team">
                        {match.blue_team_players.map((player, index) => (
                          <span 
                            key={index} 
                            className="player-name clickable" 
                            onClick={() => handlePlayerClick(player.player_name)}
                          >
                            {player.player_name}
                          </span>
                        ))}
                      </div>
                      <span className="vs">vs</span>
                      <div className="red-team">
                        {match.red_team_players.map((player, index) => (
                          <span 
                            key={index} 
                            className="player-name clickable" 
                            onClick={() => handlePlayerClick(player.player_name)}
                          >
                            {player.player_name}
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
                  <td>{getOutcomeText(match.match_data.match_outcome)}</td>
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