import React, { useEffect, useState } from 'react';
import './MatchesTable.css';

interface Match {
  id: number;
  match_id: number | null;
  blue_team: string | null;
  red_team: string | null;
  blue_score: number | null;
  red_score: number | null;
  map: string | null;
  server: string | null;
  match_outcome: number | null;
}

const MatchesTable: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/matches')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch matches');
        }
        return response.json();
      })
      .then(data => {
        setMatches(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching matches:', error);
        setError('Failed to load matches. Please try again later.');
        setLoading(false);
      });
  }, []);

  const truncateTeamName = (name: string | null) => {
    if (!name) return '';
    return name.length > 20 ? `${name.substring(0, 17)}...` : name;
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

  if (loading) return <p className="loading">Loading matches...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="matches-container">
      <h3 className="matches-title">4v4 Matches</h3>
      <div className="matches-table-wrapper">
        <table className="matches-table">
          <thead>
            <tr>
              <th>Match ID</th>
              <th>Map</th>
              <th>Server</th>
              <th>Teams</th>
              <th>Score</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {matches.map(match => (
              <tr key={match.id} className={getOutcomeClass(match.match_outcome)}>
                <td>{match.match_id}</td>
                <td>{match.map}</td>
                <td>{match.server}</td>
                <td>
                  <div className="teams">
                    <span className="blue-team" title={match.blue_team || ''}>
                      {truncateTeamName(match.blue_team)}
                    </span>
                    <span className="vs">vs</span>
                    <span className="red-team" title={match.red_team || ''}>
                      {truncateTeamName(match.red_team)}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="score">
                    <span className="blue-score">{match.blue_score}</span>
                    <span className="score-separator">:</span>
                    <span className="red-score">{match.red_score}</span>
                  </div>
                </td>
                <td>{getOutcomeText(match.match_outcome)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MatchesTable;