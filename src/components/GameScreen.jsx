import React, { useState, useEffect, useRef } from 'react';
import { generatePuzzle, checkAnswer } from '../utils/mathEngine';

export default function GameScreen({ onGameEnd }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [visualState, setVisualState] = useState('idle'); // 'idle' | 'success' | 'fail'
  const [floats, setFloats] = useState([]); // Array of { id, text, x, y } for score popups

  const inputRef = useRef(null);

  // Initialize first puzzle
  useEffect(() => {
    setCurrentPuzzle(generatePuzzle(0));
    // Focus the input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // Timer loop
  useEffect(() => {
    if (timeLeft <= 0) {
      onGameEnd(score);
      return;
    }

    const timerInterval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [timeLeft, score, onGameEnd]);

  // Keep input focused: Focus when puzzle changes, or when screen is clicked
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentPuzzle]);

  const handleScreenClick = () => {
    inputRef.current?.focus();
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setUserAnswer(val);

    if (currentPuzzle) {
      // Auto-submit if the answer is correct immediately (makes speed runs feel amazing!)
      const cleanedInput = val.trim();
      if (cleanedInput !== '' && parseInt(cleanedInput, 10) === currentPuzzle.answer) {
        triggerSuccess();
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!currentPuzzle) return;
    
    if (checkAnswer(currentPuzzle, userAnswer)) {
      triggerSuccess();
    } else {
      triggerFailure();
    }
  };

  const triggerSuccess = () => {
    // Increment score
    setScore(prev => prev + 1);
    setVisualState('success');
    
    // Add floating "+1"
    const id = Date.now() + Math.random();
    setFloats(prev => [...prev, { id, text: '+1' }]);
    
    // Clear float after animation
    setTimeout(() => {
      setFloats(prev => prev.filter(f => f.id !== id));
    }, 800);

    // Clear input & load next puzzle (pass current score + 1 since state hasn't updated yet)
    setUserAnswer('');
    setCurrentPuzzle(generatePuzzle(score + 1));
    
    setTimeout(() => setVisualState('idle'), 250);
  };

  const triggerFailure = () => {
    setVisualState('fail');
    // Clear input
    setUserAnswer('');
    setTimeout(() => setVisualState('idle'), 300);
  };

  // Convert time to MM:SS format
  const formatTime = (seconds) => {
    const s = seconds % 60;
    return `00:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      className={`arcade-screen ${visualState === 'success' ? 'success-flash' : ''} ${visualState === 'fail' ? 'shake' : ''}`}
      onClick={handleScreenClick}
      style={{ cursor: 'text', minHeight: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
    >
      {/* LCD Stats Panel */}
      <div className="lcd-display" onClick={(e) => e.stopPropagation()}>
        <div className="lcd-stat">
          <div className="lcd-label">TIME LIMIT</div>
          <div className={`lcd-val ${timeLeft <= 10 ? 'magenta' : 'yellow'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="lcd-stat">
          <div className="lcd-label">SOLVED</div>
          <div className="lcd-val cyan">
            {score < 10 ? `0${score}` : score}
          </div>
        </div>
      </div>

      {/* Floating score animation container */}
      <div style={{ position: 'relative', width: '100%', height: '0' }}>
        {floats.map(f => (
          <div 
            key={f.id} 
            className="floating-score"
            style={{ left: '50%', top: '-60px', transform: 'translateX(-50%)' }}
          >
            {f.text}
          </div>
        ))}
      </div>

      {/* Active Puzzle Display */}
      <div style={{ margin: '30px 0', textSelf: 'center', userSelect: 'none' }}>
        {currentPuzzle && (
          <>
            {currentPuzzle.description && (
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase' }}>
                {currentPuzzle.description}
              </div>
            )}
            <div style={{ fontFamily: 'var(--font-arcade)', fontSize: '3rem', color: '#fff', textShadow: '0 0 15px rgba(255,255,255,0.4)', letterSpacing: '2px' }}>
              {currentPuzzle.question}
            </div>
          </>
        )}
      </div>

      {/* User Input controls */}
      <div style={{ width: '100%', maxWidth: '280px', margin: '0 auto 10px' }} onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9\-]*"
          value={userAnswer}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="arcade-input"
          placeholder="?"
          autoComplete="off"
          autoFocus
        />
        <div className="keyboard-help">
          Type number & press Enter
        </div>
      </div>
    </div>
  );
}
