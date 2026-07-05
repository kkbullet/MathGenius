import React, { useState, useEffect } from 'react';
import { mockStorage } from '../utils/mockStorage';

export default function InvitePanel({ currentUser, onActionCompleted }) {
  const [emailInput, setEmailInput] = useState('');
  const [feedback, setFeedback] = useState({ text: '', type: '' }); // 'success' | 'error'
  const [pendingInvites, setPendingInvites] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPending();
  }, [currentUser]);

  const fetchPending = async () => {
    if (!currentUser) return;
    try {
      const { inbound } = await mockStorage.getPendingInvitations();
      setPendingInvites(inbound);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setFeedback({ text: 'Checking player...', type: '' });

    try {
      const res = await mockStorage.sendInviteByEmail(emailInput);
      if (res.success) {
        setFeedback({ text: res.message, type: 'success' });
        setEmailInput('');
        onActionCompleted();
      } else {
        setFeedback({ text: res.message, type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Error sending invite', type: 'error' });
    }

    setTimeout(() => setFeedback({ text: '', type: '' }), 4000);
  };

  const handleCopyLink = () => {
    if (!currentUser) return;
    const inviteUrl = `${window.location.origin}${window.location.pathname}?invite=${currentUser.id}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleAccept = async (inviteId) => {
    try {
      const success = await mockStorage.acceptInvite(inviteId);
      if (success) {
        await fetchPending();
        onActionCompleted();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (inviteId) => {
    try {
      const success = await mockStorage.rejectInvite(inviteId);
      if (success) {
        await fetchPending();
        onActionCompleted();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="arcade-panel" style={{ marginTop: '24px' }}>
      <div className="panel-header">
        <span>CHALLENGE FRIENDS</span>
        <span style={{ fontSize: '0.6rem', color: 'var(--color-muted)' }}>INVITES</span>
      </div>

      {/* Copy Invite Link */}
      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label className="form-label">SHARE ARCADE LINK</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            readOnly 
            value={`${window.location.origin}${window.location.pathname}?invite=${currentUser.id}`}
            className="form-input"
            style={{ flex: 1, fontSize: '0.8rem', color: 'var(--color-muted)', backgroundColor: '#09080d' }}
          />
          <button 
            onClick={handleCopyLink} 
            className="arcade-btn cyan"
            style={{ padding: '8px 12px', fontSize: '0.65rem' }}
          >
            {copied ? 'COPIED!' : 'COPY'}
          </button>
        </div>
        <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>
          Send this link to WhatsApp/Email. They will connect automatically when they join!
        </span>
      </div>

      {/* Invite by Email */}
      <form onSubmit={handleSendInvite} className="form-group" style={{ marginBottom: '20px' }}>
        <label className="form-label">INVITE BY EMAIL</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="email" 
            placeholder="friend@email.com" 
            required
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className="form-input"
            style={{ flex: 1 }}
          />
          <button 
            type="submit" 
            className="arcade-btn"
            style={{ padding: '8px 12px', fontSize: '0.65rem' }}
          >
            SEND
          </button>
        </div>
        {feedback.text && (
          <div style={{ 
            fontSize: '0.75rem', 
            marginTop: '4px', 
            color: feedback.type === 'success' ? 'var(--color-green)' : (feedback.type === 'error' ? 'var(--color-red)' : 'var(--color-yellow)'),
            textShadow: feedback.type === 'success' ? '0 0 4px rgba(57,255,20,0.3)' : 'none'
          }}>
            {feedback.text.toUpperCase()}
          </div>
        )}
      </form>

      {/* Inbound Invites */}
      {pendingInvites.length > 0 && (
        <div style={{ borderTop: '2px dashed #302a42', paddingTop: '14px', marginTop: '14px' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '8px', color: 'var(--color-yellow)' }}>
            PENDING REQUESTS ({pendingInvites.length})
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendingInvites.map(inv => (
              <div 
                key={inv.id} 
                className="social-notification"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>{inv.senderName}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>{inv.senderEmail}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    onClick={() => handleAccept(inv.id)} 
                    className="arcade-btn green"
                    style={{ padding: '6px 10px', fontSize: '0.55rem', height: '30px' }}
                  >
                    ACCEPT
                  </button>
                  <button 
                    onClick={() => handleReject(inv.id)} 
                    className="arcade-btn"
                    style={{ padding: '6px 10px', fontSize: '0.55rem', height: '30px', borderColor: 'var(--color-red)', color: 'var(--color-red)', textShadow: '0 0 5px rgba(255,49,49,0.4)' }}
                  >
                    DECL
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
