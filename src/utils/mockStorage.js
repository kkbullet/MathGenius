/**
 * Decoupled Database Layer connecting to public Supabase tables directly.
 * Handles frictionless, email-based, passwordless sign-ins on the client
 * without triggering Magic Link emails or OTP confirmation.
 */
import { supabase } from './supabaseClient';

function mapProfile(dbProfile) {
  if (!dbProfile) return null;
  return {
    id: dbProfile.id,
    username: dbProfile.username,
    email: dbProfile.email || '',
    highScore: dbProfile.high_score,
    updatedAt: dbProfile.updated_at
  };
}

export const mockStorage = {
  init() {
    console.log("Frictionless database service initialized.");
  },

  async getCurrentUser() {
    const userId = localStorage.getItem('mma_active_user_id');
    if (!userId) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      // If profile not found (e.g., db reset), wipe active session
      localStorage.removeItem('mma_active_user_id');
      return null;
    }

    return mapProfile(profile);
  },

  async getAllProfiles() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('high_score', { ascending: false });

    return (data || []).map(mapProfile);
  },

  async login(email, usernameInput) {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Check if user exists in the public profiles table
    const { data: existing, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', trimmedEmail);

    if (queryError) {
      return { error: queryError };
    }

    if (existing && existing.length > 0) {
      const user = existing[0];
      localStorage.setItem('mma_active_user_id', user.id);
      return { user: mapProfile(user) };
    }

    // 2. If user doesn't exist, validate the chosen username (case-insensitive check)
    const defaultUsername = trimmedEmail.split('@')[0];
    const username = usernameInput ? usernameInput.trim() : defaultUsername;

    const { data: duplicateUsername, error: usernameQueryError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username); // Case-insensitive lookup

    if (usernameQueryError) {
      return { error: usernameQueryError };
    }

    if (duplicateUsername && duplicateUsername.length > 0) {
      return { 
        error: { 
          message: 'Username is already taken by another player. Please choose a different name!' 
        } 
      };
    }

    // 3. Create a new profile instantly
    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .insert({
        email: trimmedEmail,
        username: username,
        high_score: 0
      })
      .select();

    if (insertError || !inserted || inserted.length === 0) {
      return { error: insertError || new Error("Failed to create profile") };
    }

    const newUser = inserted[0];
    localStorage.setItem('mma_active_user_id', newUser.id);
    return { user: mapProfile(newUser) };
  },

  async logout() {
    localStorage.removeItem('mma_active_user_id');
  },

  async deleteProfile() {
    const user = await this.getCurrentUser();
    if (!user) return false;

    // Delete row in profiles table. Foreign keys cascade-delete friendships.
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (error) {
      console.error("Error deleting profile:", error);
      return false;
    }

    localStorage.removeItem('mma_active_user_id');
    return true;
  },

  async saveScore(score) {
    const user = await this.getCurrentUser();
    if (!user) return null;

    if (score > user.highScore) {
      const { error } = await supabase
        .from('profiles')
        .update({ high_score: score })
        .eq('id', user.id);

      return { updated: !error, newHighScore: error ? user.highScore : score };
    }
    return { updated: false, newHighScore: user.highScore };
  },

  async getFriends() {
    const user = await this.getCurrentUser();
    if (!user) return [];

    // Query friendships where status is accepted
    const { data: friendships } = await supabase
      .from('friendships')
      .select('sender_id, recipient_id')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);

    if (!friendships || friendships.length === 0) return [];

    // Extract friend IDs
    const friendIds = friendships.map(f => f.sender_id === user.id ? f.recipient_id : f.sender_id);

    // Fetch friend profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', friendIds);

    return (profiles || []).map(mapProfile).filter(Boolean);
  },

  async getPendingInvitations() {
    const user = await this.getCurrentUser();
    if (!user) return { inbound: [], outbound: [] };

    // Fetch inbound pending invites
    const { data: inboundInvites } = await supabase
      .from('friendships')
      .select('id, sender_id, created_at')
      .eq('recipient_id', user.id)
      .eq('status', 'pending');

    let inbound = [];
    if (inboundInvites && inboundInvites.length > 0) {
      const senderIds = inboundInvites.map(i => i.sender_id);
      
      const { data: senderProfiles } = await supabase
        .from('profiles')
        .select('id, username, email')
        .in('id', senderIds);

      inbound = inboundInvites.map(inv => {
        const sender = (senderProfiles || []).find(p => p.id === inv.sender_id);
        return {
          id: inv.id,
          senderName: sender ? sender.username : 'Unknown Player',
          senderEmail: sender ? sender.email : 'Pending Request',
          senderId: inv.sender_id
        };
      });
    }

    // Fetch outbound pending invites
    const { data: outboundInvites } = await supabase
      .from('friendships')
      .select('id, recipient_id, created_at')
      .eq('sender_id', user.id)
      .eq('status', 'pending');

    const outbound = (outboundInvites || []).map(inv => ({
      id: inv.id,
      recipientId: inv.recipient_id,
      status: 'pending'
    }));

    return { inbound, outbound };
  },

  async sendInviteByEmail(recipientEmail) {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: 'Please sign in first' };

    const email = recipientEmail.trim().toLowerCase();
    if (email === user.email.toLowerCase()) {
      return { success: false, message: 'You cannot invite yourself' };
    }
    
    // Resolve email directly in public profiles table
    const { data: profiles, error: queryError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('email', email);

    if (queryError || !profiles || profiles.length === 0) {
      return { success: false, message: 'Player email not registered yet' };
    }

    const recipient = profiles[0];

    // Check if connection already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipient.id}),and(sender_id.eq.${recipient.id},recipient_id.eq.${user.id})`);

    if (existing && existing.length > 0) {
      if (existing[0].status === 'accepted') {
        return { success: false, message: 'Already friends' };
      }
      return { success: false, message: 'Friend request is already pending' };
    }

    // Send the friendship invite
    const { error: insertError } = await supabase
      .from('friendships')
      .insert({
        sender_id: user.id,
        recipient_id: recipient.id,
        status: 'pending'
      });

    if (insertError) {
      return { success: false, message: 'Failed to send invite' };
    }

    return { success: true, message: 'Friend invitation sent successfully!' };
  },

  async acceptInvite(inviteId) {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', inviteId);

    return !error;
  },

  async rejectInvite(inviteId) {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', inviteId);

    return !error;
  },

  async getLeaderboard(friendsOnly = false) {
    const user = await this.getCurrentUser();

    if (friendsOnly && user) {
      const friends = await this.getFriends();
      const list = [user, ...friends];
      return list.sort((a, b) => b.highScore - a.highScore);
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('high_score', { ascending: false })
      .limit(50);

    return (profiles || []).map(mapProfile);
  },

  async processInviteLink(inviterId) {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, message: 'Please sign in to connect' };
    if (user.id === inviterId) return { success: false, message: 'You cannot invite yourself' };

    const { data: inviter } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', inviterId)
      .single();

    if (!inviter) return { success: false, message: 'Inviter profile not found' };

    const { data: existing } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${inviterId}),and(sender_id.eq.${inviterId},recipient_id.eq.${user.id})`);

    if (existing && existing.length > 0) {
      if (existing[0].status === 'accepted') {
        return { success: false, message: 'Already friends' };
      }
      
      // Auto-accept if they click an invite link from someone who already sent them an invite!
      if (existing[0].recipient_id === user.id) {
        await this.acceptInvite(existing[0].id);
        return { success: true, message: 'Connected with friend!' };
      }
      return { success: false, message: 'Friend request is already pending' };
    }

    const { error } = await supabase
      .from('friendships')
      .insert({
        sender_id: user.id,
        recipient_id: inviterId,
        status: 'pending'
      });

    if (error) return { success: false, message: 'Failed to connect' };
    return { success: true, message: 'Friend request sent!' };
  }
};
