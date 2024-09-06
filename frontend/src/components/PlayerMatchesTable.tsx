import React, { useEffect, useState } from 'react';
import './MatchesTable.css'; // We'll reuse the styles from MatchesTable

interface Player {
  id: number;
  discord_id: string;
  player_name: string;
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

interface PlayerMatchesTableProps {
  playerName: string;
  onClose: () => void;
}

const PlayerMatchesTable: React.FC<PlayerMatchesTableProps> = ({ playerName, onClose }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayerMatches = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/matches/player/${encodeURIComponent(playerName)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch player matches');
        }
        const data = await response.json();
        setMatches(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching player matches:', error);
        setError('Failed to load player matches. Please try again later.');
        setLoading(false);
      }
    };
  
    fetchPlayerMatches();
  }, [playerName]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getOutcomeClass = (outcome: number | null, team: 'blue' | 'red') => {
    if (outcome === 1 && team === 'blue') return 'win';
    if (outcome === 2 && team === 'red') return 'win';
    if (outcome === null) return 'draw';
    return 'loss';
  };

  const getScores = (match: Match) => {
    const blueScore = match.match_outcome === 1 ? match.winning_score : match.losing_score;
    const redScore = match.match_outcome === 2 ? match.winning_score : match.losing_score;
    return { blueScore, redScore };
  };

  if (loading) return <p className="loading">Loading player matches...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="player-matches-container">
      <h3 className="matches-title">Match History for {playerName}</h3>
      <button onClick={onClose} className="close-button">Close</button>
      <div className="matches-table-wrapper">
        <table className="matches-table">
          <thead>
            <tr>
              <th>Match ID</th>
              <th>Date Played</th>
              <th>Map</th>
              <th>Server</th>
              <th>Team</th>
              <th>Score</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {matches.map(match => {
              const { blueScore, redScore } = getScores(match);
              const playerTeam = match.blue_team?.includes(playerName) ? 'blue' : 'red';
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
                  <td>{playerTeam === 'blue' ? (match.match_outcome === 1 ? 'Win' : 'Loss') : (match.match_outcome === 2 ? 'Win' : 'Loss')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlayerMatchesTable;