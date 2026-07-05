import React from 'react';

export default function ScoreSummary({ score, highScoreBefore, onReplay, onBackToDashboard }) {
  const isNewRecord = score > highScoreBefore;

  return (
    <div className="arcade-screen" style={{ textAlign: 'center', padding: '30px 10px', minHeight: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-arcade)', color: 'var(--color-red)', textShadow: '0 0 10px rgba(255, 49, 49, 0.6)', fontSize: '1.4rem', margin: '0 0 20px 0', textTransform: 'uppercase' }}>
          GAME OVER
        </h2>

        {isNewRecord ? (
          <div style={{ margin: '20px 0' }}>
            <div className="game-title" style={{ color: 'var(--color-yellow)', textShadow: '0 0 12px rgba(255,222,0,0.8)', fontSize: '1.2rem', marginBottom: '10px' }}>
              NEW RECORD!
            </div>
            <div style={{ fontFamily: 'var(--font-arcade)', fontSize: '4.5rem', color: 'var(--color-yellow)', textShadow: '0 0 20px rgba(255,222,0,0.5)', margin: '10px 0' }}>
              {score}
            </div>
            <div style={{ color: 'var(--color-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>
              Previous Best: {highScoreBefore}
            </div>
          </div>
        ) : (
          <div style={{ margin: '20px 0' }}>
            <div style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-arcade)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '10px' }}>
              PUZZLES SOLVED
            </div>
            <div style={{ fontFamily: 'var(--font-arcade)', fontSize: '4.5rem', color: 'var(--color-cyan)', textShadow: 'var(--text-glow-cyan)', margin: '10px 0' }}>
              {score}
            </div>
            <div style={{ color: 'var(--color-text)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              YOUR BEST: {Math.max(score, highScoreBefore)}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '280px', margin: '20px auto 0' }}>
        <button onClick={onReplay} className="arcade-btn green">
          INSERT COIN (REPLAY)
        </button>
        <button onClick={onBackToDashboard} className="arcade-btn cyan">
          RETURN TO CABINET
        </button>
      </div>
    </div>
  );
}


