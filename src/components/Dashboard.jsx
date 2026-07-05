import React, { useState, useEffect } from 'react';
import { mockStorage } from '../utils/mockStorage';

export default function Dashboard({ currentUser, onLogout, onActionCompleted }) {
  const [friends, setFriends] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [allProfiles, setAllProfiles] = useState([]);
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = () => {
    if (!currentUser) return;
    setFriends(mockStorage.getFriends());
    const { inbound } = mockStorage.getPendingInvitations();
    setPendingCount(inbound.length);
    setAllProfiles(mockStorage.getAllProfiles());
  };

  const handleSwitchProfile = (profileId) => {
    const profiles = mockStorage.getAllProfiles();
    const target = profiles.find(p => p.id === profileId);
    if (target) {
      localStorage.setItem('mma_active_user_id', target.id);
      onActionCompleted(); // Triggers reload in App.js
      setShowProfileSwitcher(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="arcade-panel cyan">
      <div className="panel-header">
        <span>PLAYER PROFILE</span>
        <button 
          onClick={onLogout} 
          className="arcade-btn" 
          style={{ padding: '4px 8px', fontSize: '0.55rem', border: '1px solid var(--color-magenta)' }}
        >
          LOGOUT
        </button>
      </div>

      {/* User Stats Card */}
      <div style={{ backgroundColor: '#09080d', border: '1px solid #201c2d', borderRadius: '4px', padding: '12px', textAlign: 'left', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
            {currentUser.username.toUpperCase()}
          </span>
          {pendingCount > 0 && (
            <span className="badge-count" style={{ animation: 'flicker 1.5s infinite alternate' }}>
              {pendingCount} REQ
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '8px', wordBreak: 'break-all' }}>
          ID: {currentUser.email}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1a1724', paddingTop: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>PERSONAL BEST</span>
          <span style={{ fontFamily: 'var(--font-arcade)', fontSize: '0.8rem', color: 'var(--color-yellow)', textShadow: '0 0 5px rgba(255,222,0,0.5)' }}>
            {currentUser.highScore} PTS
          </span>
        </div>
      </div>

      {/* Friends List */}
      <div style={{ textAlign: 'left' }}>
        <div className="panel-header" style={{ fontSize: '0.75rem', marginBottom: '10px', color: 'var(--color-cyan)', textShadow: 'var(--text-glow-cyan)' }}>
          <span>FRIENDS DASHBOARD</span>
          <span>{friends.length} CONNECTED</span>
        </div>

        {friends.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '20px 0', fontSize: '0.8rem', border: '1px dashed #201c2d', borderRadius: '4px' }}>
            NO FRIENDS CONNECTED.<br/>USE SHARE LINK BELOW TO INVITE!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {friends.map(friend => {
              const diff = currentUser.highScore - friend.highScore;
              let statusText = '';
              let statusColor = 'var(--color-muted)';
              
              if (diff > 0) {
                statusText = `YOU LEAD BY ${diff}`;
                statusColor = 'var(--color-green)';
              } else if (diff < 0) {
                statusText = `BEHIND BY ${Math.abs(diff)}`;
                statusColor = 'var(--color-red)';
              } else {
                statusText = 'TIED SCORE';
                statusColor = 'var(--color-yellow)';
              }

              return (
                <div 
                  key={friend.id}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '8px 10px', 
                    backgroundColor: 'rgba(255,255,255,0.01)', 
                    border: '1px solid #1a1624', 
                    borderRadius: '4px' 
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>{friend.username}</span>
                    <span style={{ fontSize: '0.65rem', color: statusColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {statusText}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-arcade)', fontSize: '0.75rem', color: 'var(--color-cyan)' }}>
                    {friend.highScore} PTS
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Profile Switcher (For local testing of invites/leaderboard) */}
      <div style={{ marginTop: '20px', borderTop: '1px solid #201c2d', paddingTop: '10px' }}>
        <button 
          onClick={() => {
            fetchDashboardData();
            setShowProfileSwitcher(!showProfileSwitcher);
          }} 
          className="arcade-btn"
          style={{ width: '100%', padding: '6px', fontSize: '0.6rem', borderColor: '#403b54', color: 'var(--color-muted)', textShadow: 'none', boxShadow: 'none' }}
        >
          {showProfileSwitcher ? 'HIDE PROFILE SWITCHER' : '🧪 TEST MULTIPLAYER (SWITCH PROFILE)'}
        </button>

        {showProfileSwitcher && (
          <div style={{ marginTop: '8px', backgroundColor: '#09080d', border: '1px solid #302a42', borderRadius: '4px', padding: '8px' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-yellow)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Switch user profile to test friends, scoring, & invite links on one machine:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {allProfiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSwitchProfile(p.id)}
                  disabled={p.id === currentUser.id}
                  style={{
                    backgroundColor: p.id === currentUser.id ? 'rgba(255,255,255,0.05)' : '#1a1626',
                    border: '1px solid #302a42',
                    borderRadius: '2px',
                    color: p.id === currentUser.id ? 'var(--color-green)' : '#fff',
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    textAlign: 'left',
                    cursor: p.id === currentUser.id ? 'default' : 'pointer'
                  }}
                >
                  {p.username} ({p.highScore} pts) {p.id === currentUser.id && '⚡'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
