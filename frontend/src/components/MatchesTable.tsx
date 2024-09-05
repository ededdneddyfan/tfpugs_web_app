import React, { useEffect, useState } from 'react';
import './MatchesTable.css';

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

  const getScores = (match: Match) => {
    const blueScore = match.match_outcome === 1 ? match.winning_score : match.losing_score;
    const redScore = match.match_outcome === 2 ? match.winning_score : match.losing_score;
    return { blueScore, redScore };
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
            {matches.map(match => {
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