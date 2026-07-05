import React, { useState, useEffect } from 'react';
import { mockStorage } from './utils/mockStorage';
import GameScreen from './components/GameScreen';
import ScoreSummary from './components/ScoreSummary';
import Dashboard from './components/Dashboard';
import InvitePanel from './components/InvitePanel';
import Leaderboard from './components/Leaderboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [loginFeedback, setLoginFeedback] = useState('');
  
  // Game states: 'dashboard' | 'playing' | 'gameover'
  const [gameState, setGameState] = useState('dashboard');
  const [lastRoundScore, setLastRoundScore] = useState(0);
  const [highScoreBeforeRound, setHighScoreBeforeRound] = useState(0);
  
  // Used to trigger list refetches in other components
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Initialize storage and check active session
  useEffect(() => {
    mockStorage.init();

    // Check current local storage session on mount
    async function checkUser() {
      const user = await mockStorage.getCurrentUser();
      setCurrentUser(user);
    }
    checkUser();

    // Parse URL query params for invitations: ?invite=USER_ID
    const params = new URLSearchParams(window.location.search);
    const inviteId = params.get('invite');
    if (inviteId) {
      localStorage.setItem('mma_pending_invite_id', inviteId);
    }
  }, []);

  // Process any pending invite link once the user is authenticated
  useEffect(() => {
    if (currentUser) {
      async function processInvite() {
        const pendingInviteId = localStorage.getItem('mma_pending_invite_id');
        if (pendingInviteId) {
          const res = await mockStorage.processInviteLink(pendingInviteId);
          if (res.success) {
            alert(`Connected with inviter!`);
          }
          localStorage.removeItem('mma_pending_invite_id');
          // Clear invite query param from URL bar
          const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.pushState({ path: newUrl }, '', newUrl);
          await triggerReload();
        }
      }
      processInvite();
    }
  }, [currentUser]);

  const triggerReload = async () => {
    const user = await mockStorage.getCurrentUser();
    setCurrentUser(user);
    setUpdateTrigger(prev => prev + 1);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setLoginFeedback('AUTHENTICATING...');

    try {
      const { user, error } = await mockStorage.login(emailInput, usernameInput);
      if (error) {
        setLoginFeedback(error.message.toUpperCase());
      } else {
        setCurrentUser(user);
        setLoginFeedback('');
        setEmailInput('');
        setUsernameInput('');
      }
    } catch (err) {
      setLoginFeedback('LOGIN ERROR. TRY AGAIN.');
    }
  };

  const handleLogout = async () => {
    await mockStorage.logout();
    setCurrentUser(null);
    setGameState('dashboard');
  };

  const handleStartGame = () => {
    if (!currentUser) return;
    setHighScoreBeforeRound(currentUser.highScore);
    setGameState('playing');
  };

  const handleGameEnd = async (finalScore) => {
    setLastRoundScore(finalScore);
    // Save to database
    await mockStorage.saveScore(finalScore);
    await triggerReload();
    setGameState('gameover');
  };

  // Render Login view if user is unauthenticated
  if (!currentUser) {
    return (
      <div className="crt-overlay app-container" style={{ justifyContent: 'center', minHeight: '100vh', alignItems: 'center' }}>
        <header>
          <h1 className="game-title">MATH ARCADE</h1>
          <p className="game-subtitle">SHARPEN YOUR MIND</p>
        </header>

        <div className="arcade-panel magenta" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div className="panel-header" style={{ justifyContent: 'center', color: 'var(--color-cyan)', textShadow: 'var(--text-glow-cyan)' }}>
            <span>INSERT COIN / SIGN IN</span>
          </div>

          <div style={{ color: 'var(--color-muted)', fontSize: '0.8rem', marginBottom: '24px', textTransform: 'uppercase' }}>
            Enter your email to play. Login is instant with no password required!
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">EMAIL ADDRESS</label>
              <input
                type="email"
                required
                placeholder="player@email.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="form-input"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">PLAYER INITIALS / NAME (OPTIONAL)</label>
              <input
                type="text"
                placeholder="e.g. PixelWizard"
                maxLength={15}
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="form-input"
              />
            </div>

            {loginFeedback && (
              <div style={{ 
                color: 'var(--color-red)', 
                fontSize: '0.75rem', 
                textTransform: 'uppercase'
              }}>
                {loginFeedback}
              </div>
            )}

            <button type="submit" className="arcade-btn cyan" style={{ marginTop: '10px' }}>
              START GAME (PLAY NOW)
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="crt-overlay app-container">
      {/* Game Header */}
      <header>
        <h1 className="game-title">MATH ARCADE</h1>
        <p className="game-subtitle">SHARPEN YOUR MIND</p>
      </header>

      {/* Main Grid Layout */}
      <main className="main-layout">
        {/* Left Hand Column: Arcade Game Screen */}
        <section>
          {gameState === 'dashboard' && (
            <div className="arcade-panel magenta" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
              <div>
                <div className="panel-header" style={{ color: 'var(--color-cyan)', textShadow: 'var(--text-glow-cyan)' }}>
                  <span>ARCADE CABINET</span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--color-green)', textShadow: 'var(--text-glow-green)' }}>ONLINE</span>
                </div>

                <div className="arcade-screen" style={{ padding: '30px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-arcade)', color: 'var(--color-yellow)', marginBottom: '16px' }}>
                    READY PLAYER ONE
                  </div>
                  <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '24px' }}>
                    Solve as many math puzzles as you can in 60 seconds. Difficulty scales up with every correct answer!
                  </p>
                  <div style={{ display: 'inline-block', backgroundColor: '#100e16', border: '1px dashed #302a42', padding: '8px 16px', borderRadius: '4px', color: 'var(--color-magenta)', fontFamily: 'var(--font-arcade)', fontSize: '0.65rem' }}>
                    BEST SCORE: {currentUser.highScore} PTS
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <button 
                  onClick={handleStartGame} 
                  className="arcade-btn green" 
                  style={{ width: '100%', fontSize: '1rem', letterSpacing: '1px' }}
                >
                  PRESS TO START GAME
                </button>
              </div>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="arcade-panel magenta">
              <GameScreen onGameEnd={handleGameEnd} />
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="arcade-panel magenta">
              <ScoreSummary
                score={lastRoundScore}
                highScoreBefore={highScoreBeforeRound}
                onReplay={handleStartGame}
                onBackToDashboard={() => setGameState('dashboard')}
              />
            </div>
          )}
        </section>

        {/* Right Hand Column: Dashboard Stats & Social Invite Panel */}
        <aside>
          <Dashboard 
            currentUser={currentUser} 
            onLogout={handleLogout} 
            onActionCompleted={triggerReload} 
          />

          <InvitePanel 
            currentUser={currentUser} 
            onActionCompleted={triggerReload} 
          />

          <div style={{ marginTop: '24px' }}>
            <Leaderboard 
              currentUser={currentUser} 
              updateTrigger={updateTrigger} 
            />
          </div>
        </aside>
      </main>
    </div>
  );
}
