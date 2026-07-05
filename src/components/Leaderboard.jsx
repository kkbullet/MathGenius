import React, { useState, useEffect } from 'react';
import { mockStorage } from '../utils/mockStorage';

export default function Leaderboard({ currentUser, updateTrigger }) {
  const [friendsOnly, setFriendsOnly] = useState(true);
  const [scores, setScores] = useState([]);

  // Fetch scores when component mounts, active tab changes, or user actions trigger updates
  useEffect(() => {
    async function fetchScores() {
      try {
        const list = await mockStorage.getLeaderboard(friendsOnly);
        setScores(list);
      } catch (e) {
        console.error(e);
      }
    }
    fetchScores();
  }, [friendsOnly, currentUser, updateTrigger]);

  return (
    <div className="arcade-panel cyan">
      <div className="panel-header">
        <span>LEADERBOARD</span>
        <span style={{ fontSize: '0.6rem', color: 'var(--color-muted)' }}>RANKINGS</span>
      </div>

      {/* Tabs */}
      <div className="tab-header">
        <button 
          className={`tab-btn ${friendsOnly ? 'active' : ''}`}
          onClick={() => setFriendsOnly(true)}
        >
          FRIENDS
        </button>
        <button 
          className={`tab-btn ${!friendsOnly ? 'active' : ''}`}
          onClick={() => setFriendsOnly(false)}
        >
          GLOBAL
        </button>
      </div>

      {/* Leaderboard List */}
      {scores.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '20px 0', fontSize: '0.85rem' }}>
          NO PLYRS REGISTERED
        </div>
      ) : (
        <ul className="arcade-list">
          {scores.map((player, index) => {
            const isCurrentUser = currentUser && player.id === currentUser.id;
            const rank = index + 1;
            let rankClass = '';
            if (rank === 1) rankClass = 'rank-1';
            else if (rank === 2) rankClass = 'rank-2';
            else if (rank === 3) rankClass = 'rank-3';

            return (
              <li 
                key={player.id} 
                className={`arcade-list-item ${isCurrentUser ? 'highlight' : ''} ${rankClass}`}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="rank-badge">
                    {rank < 10 ? `0${rank}` : rank}
                  </span>
                  <span style={{ 
                    fontFamily: isCurrentUser ? 'var(--font-arcade)' : 'inherit', 
                    fontSize: isCurrentUser ? '0.75rem' : '0.95rem',
                    color: isCurrentUser ? 'var(--color-yellow)' : 'var(--color-text)'
                  }}>
                    {player.username} {isCurrentUser && '(YOU)'}
                  </span>
                </div>
                <div style={{ 
                  fontFamily: 'var(--font-arcade)', 
                  fontSize: '0.8rem',
                  color: isCurrentUser ? 'var(--color-yellow)' : 'var(--color-cyan)',
                  textShadow: isCurrentUser ? '0 0 4px rgba(255,222,0,0.4)' : 'none'
                }}>
                  {player.highScore} PTS
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div style={{ marginTop: '16px', fontSize: '0.7rem', color: 'var(--color-muted)', textAlign: 'center', textTransform: 'uppercase' }}>
        {friendsOnly ? 'Showing friend circle high scores' : 'Showing all active players'}
      </div>
    </div>
  );
}
