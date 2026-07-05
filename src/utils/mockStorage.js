/**
 * Mock Database Layer using LocalStorage.
 * Simulates authentication, score saving, invitations, and leaderboards.
 */

const STORAGE_KEYS = {
  PROFILES: 'mma_profiles',
  ACTIVE_USER_ID: 'mma_active_user_id',
  INVITATIONS: 'mma_invitations'
};

// Seed initial mock profiles if local storage is empty
const DEFAULT_PROFILES = [
  { id: 'dev-1', email: 'arcade_champ@retro.com', username: 'ArcadeChamp', highScore: 32 },
  { id: 'dev-2', email: 'pixel_wizard@retro.com', username: 'PixelWizard', highScore: 24 },
  { id: 'dev-3', email: 'math_geek@retro.com', username: 'MathGeek', highScore: 18 },
  { id: 'dev-4', email: 'speed_runner@retro.com', username: 'SpeedRunner', highScore: 12 }
];

const DEFAULT_INVITATIONS = [
  { id: 'inv-1', senderId: 'dev-2', recipientEmail: 'arcade_champ@retro.com', status: 'accepted' }, // Friends
  { id: 'inv-2', senderId: 'dev-3', recipientEmail: 'arcade_champ@retro.com', status: 'accepted' }, // Friends
  { id: 'inv-3', senderId: 'dev-4', recipientEmail: 'arcade_champ@retro.com', status: 'pending' }   // Inbound pending
];

function getStoredData(key, fallback) {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return fallback;
  }
}

function saveStoredData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Exported APIs
export const mockStorage = {
  init() {
    getStoredData(STORAGE_KEYS.PROFILES, DEFAULT_PROFILES);
    getStoredData(STORAGE_KEYS.INVITATIONS, DEFAULT_INVITATIONS);
  },

  getCurrentUser() {
    const userId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
    if (!userId) return null;
    const profiles = getStoredData(STORAGE_KEYS.PROFILES, DEFAULT_PROFILES);
    return profiles.find(p => p.id === userId) || null;
  },

  getAllProfiles() {
    return getStoredData(STORAGE_KEYS.PROFILES, DEFAULT_PROFILES);
  },

  login(email, usernameInput) {
    const trimmedEmail = email.trim().toLowerCase();
    const profiles = getStoredData(STORAGE_KEYS.PROFILES, DEFAULT_PROFILES);
    
    let user = profiles.find(p => p.email === trimmedEmail);
    
    if (!user) {
      // Create new profile
      const defaultUsername = trimmedEmail.split('@')[0];
      const username = usernameInput ? usernameInput.trim() : defaultUsername;
      user = {
        id: 'user_' + Date.now(),
        email: trimmedEmail,
        username: username,
        highScore: 0
      };
      profiles.push(user);
      saveStoredData(STORAGE_KEYS.PROFILES, profiles);
    }
    
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, user.id);
    return user;
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_ID);
  },

  saveScore(score) {
    const user = this.getCurrentUser();
    if (!user) return null;

    if (score > user.highScore) {
      const profiles = getStoredData(STORAGE_KEYS.PROFILES, DEFAULT_PROFILES);
      const userIndex = profiles.findIndex(p => p.id === user.id);
      if (userIndex !== -1) {
        profiles[userIndex].highScore = score;
        saveStoredData(STORAGE_KEYS.PROFILES, profiles);
        return { updated: true, newHighScore: score };
      }
    }
    return { updated: false, newHighScore: user.highScore };
  },

  getInvitations() {
    return getStoredData(STORAGE_KEYS.INVITATIONS, DEFAULT_INVITATIONS);
  },

  getFriends() {
    const user = this.getCurrentUser();
    if (!user) return [];

    const invites = this.getInvitations();
    const profiles = this.getAllProfiles();

    // Friendships are invitations with status === 'accepted'
    // where either the sender is the user, or the recipient is the user
    return invites
      .filter(inv => inv.status === 'accepted' && (inv.senderId === user.id || inv.recipientEmail.toLowerCase() === user.email.toLowerCase()))
      .map(inv => {
        const friendId = inv.senderId === user.id 
          ? profiles.find(p => p.email.toLowerCase() === inv.recipientEmail.toLowerCase())?.id
          : inv.senderId;
        return profiles.find(p => p.id === friendId);
      })
      .filter(p => p !== undefined && p.id !== user.id);
  },

  getPendingInvitations() {
    const user = this.getCurrentUser();
    if (!user) return { inbound: [], outbound: [] };

    const invites = this.getInvitations();
    const profiles = this.getAllProfiles();

    const inbound = invites
      .filter(inv => inv.status === 'pending' && inv.recipientEmail.toLowerCase() === user.email.toLowerCase())
      .map(inv => {
        const sender = profiles.find(p => p.id === inv.senderId);
        return { ...inv, senderName: sender ? sender.username : 'Unknown Player', senderEmail: sender ? sender.email : '' };
      });

    const outbound = invites
      .filter(inv => inv.status === 'pending' && inv.senderId === user.id);

    return { inbound, outbound };
  },

  sendInviteByEmail(recipientEmail) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, message: 'Please sign in first' };

    const email = recipientEmail.trim().toLowerCase();
    if (email === user.email.toLowerCase()) {
      return { success: false, message: 'You cannot invite yourself' };
    }

    const invites = this.getInvitations();
    
    // Check if invitation already exists
    const existing = invites.find(inv => 
      (inv.senderId === user.id && inv.recipientEmail.toLowerCase() === email) ||
      (inv.senderId === this.getAllProfiles().find(p => p.email.toLowerCase() === email)?.id && inv.recipientEmail.toLowerCase() === user.email.toLowerCase())
    );

    if (existing) {
      if (existing.status === 'accepted') {
        return { success: false, message: 'Already friends' };
      }
      return { success: false, message: 'Friend request is already pending' };
    }

    // Create new invite
    const newInvite = {
      id: 'inv_' + Date.now(),
      senderId: user.id,
      recipientEmail: email,
      status: 'pending'
    };

    invites.push(newInvite);
    saveStoredData(STORAGE_KEYS.INVITATIONS, invites);

    // If the recipient does not exist yet, we still send the invite.
    // When they sign up later with this email, the pending invite will show up.
    return { success: true, message: 'Friend invitation sent successfully!' };
  },

  acceptInvite(inviteId) {
    const invites = this.getInvitations();
    const index = invites.findIndex(inv => inv.id === inviteId);
    if (index !== -1) {
      invites[index].status = 'accepted';
      saveStoredData(STORAGE_KEYS.INVITATIONS, invites);
      return true;
    }
    return false;
  },

  rejectInvite(inviteId) {
    const invites = this.getInvitations();
    const filtered = invites.filter(inv => inv.id !== inviteId);
    saveStoredData(STORAGE_KEYS.INVITATIONS, filtered);
    return true;
  },

  getLeaderboard(friendsOnly = false) {
    const user = this.getCurrentUser();
    const profiles = this.getAllProfiles();

    if (friendsOnly && user) {
      const friends = this.getFriends();
      const list = [user, ...friends];
      return list.sort((a, b) => b.highScore - a.highScore);
    }

    return [...profiles].sort((a, b) => b.highScore - a.highScore);
  },

  processInviteLink(inviterId) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, message: 'Please sign in to connect' };
    if (user.id === inviterId) return { success: false, message: 'You cannot invite yourself' };

    const profiles = this.getAllProfiles();
    const inviter = profiles.find(p => p.id === inviterId);
    if (!inviter) return { success: false, message: 'Inviter profile not found' };

    return this.sendInviteByEmail(inviter.email);
  }
};
