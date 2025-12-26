import { supabase, getCurrentUser } from './supabase';

/**
 * CloudStorageManager - Handles Supabase sync for Loomiverse
 *
 * This works alongside localStorage:
 * - localStorage = fast, offline, immediate
 * - Supabase = persistent, cross-device, backup
 *
 * Strategy: Write to both, read from localStorage first
 */
class CloudStorageManager {
  constructor() {
    this.syncQueue = [];
    this.isSyncing = false;
    this.isOnline = navigator.onLine;
    this.user = null;
    this.authReady = false;
    this.authPromise = null;

    // Listen for online/offline
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Check auth state on init - store the promise so we can wait for it
    this.authPromise = this.initAuth();
  }

  async initAuth() {
    try {
      this.user = await getCurrentUser();
      console.log('[Cloud] Initial auth check:', this.user ? this.user.email : 'not signed in');
    } catch (e) {
      console.error('[Cloud] Auth check failed:', e);
    }
    this.authReady = true;

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      this.user = session?.user || null;
      console.log('[Cloud] Auth state changed:', event, this.user?.email || 'signed out');
      if (this.user) {
        // Process any queued syncs now that we have a user
        this.processSyncQueue();
      }
    });
  }

  // Wait for auth to be ready before checking
  async ensureAuthReady() {
    if (!this.authReady && this.authPromise) {
      await this.authPromise;
    }
  }

  // Check if cloud sync is available
  canSync() {
    return this.isOnline && this.user !== null;
  }

  // ============================================
  // STORY OPERATIONS
  // ============================================

  async saveStory(localId, data) {
    // Wait for auth to be ready before checking
    await this.ensureAuthReady();

    if (!this.canSync()) {
      console.log('[Cloud] Cannot sync - online:', this.isOnline, 'user:', !!this.user, 'authReady:', this.authReady);
      this.queueSync('story', 'upsert', { localId, data });
      return null;
    }

    try {
      console.log('[Cloud] Saving story:', data.bible?.title, 'for user:', this.user.id);

      const { data: result, error } = await supabase
        .from('loom_stories')
        .upsert({
          user_id: this.user.id,
          local_id: localId,
          title: data.bible?.title || 'Untitled',
          genre: data.bible?.genre || 'Unknown',
          logline: data.bible?.logline || '',
          bible: data.bible,
          current_chapter: data.currentChapter,
          generated_chapters: data.generatedChapters || [],
          cover_gradient: data.coverGradient,
          status: data.status || 'active',
          bookmarks: data.bookmarks || []
        }, {
          onConflict: 'user_id,local_id'
        })
        .select()
        .single();

      if (error) {
        console.error('[Cloud] Supabase error:', error.code, error.message, error.details, error.hint);
        throw error;
      }
      console.log('[Cloud] Story saved successfully:', data.bible?.title);
      return result;
    } catch (error) {
      console.error('[Cloud] Save story failed:', error.message, error);
      this.queueSync('story', 'upsert', { localId, data });
      return null; // Don't throw - let app continue working
    }
  }

  async loadStory(localId) {
    if (!this.canSync()) return null;

    try {
      const { data, error } = await supabase
        .from('loom_stories')
        .select('*')
        .eq('user_id', this.user.id)
        .eq('local_id', localId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[Cloud] Load story failed:', error.message);
      return null;
    }
  }

  async listStories(includeArchived = false) {
    if (!this.canSync()) return [];

    try {
      let query = supabase
        .from('loom_stories')
        .select('*')
        .eq('user_id', this.user.id)
        .order('updated_at', { ascending: false });

      if (!includeArchived) {
        query = query.neq('status', 'archived');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[Cloud] List stories failed:', error.message);
      return [];
    }
  }

  async deleteStory(localId) {
    if (!this.canSync()) {
      this.queueSync('story', 'delete', { localId });
      return false;
    }

    try {
      const { error } = await supabase
        .from('loom_stories')
        .delete()
        .eq('user_id', this.user.id)
        .eq('local_id', localId);

      if (error) throw error;
      console.log('[Cloud] Story deleted:', localId);
      return true;
    } catch (error) {
      console.error('[Cloud] Delete story failed:', error.message);
      return false;
    }
  }

  // ============================================
  // CHARACTER OPERATIONS
  // ============================================

  async saveCharacter(charData) {
    if (!this.canSync()) {
      this.queueSync('character', 'upsert', { charData });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('loom_characters')
        .upsert({
          user_id: this.user.id,
          name: charData.name,
          role: charData.role,
          data: charData,
          origin: charData.origin || 'story',
          local_story_id: charData.storyId,
          story_title: charData.storyTitle
        })
        .select()
        .single();

      if (error) throw error;
      console.log('[Cloud] Character saved:', charData.name);
      return data;
    } catch (error) {
      console.error('[Cloud] Save character failed:', error.message);
      return null;
    }
  }

  async listCharacters() {
    if (!this.canSync()) return [];

    try {
      const { data, error } = await supabase
        .from('loom_characters')
        .select('*')
        .eq('user_id', this.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[Cloud] List characters failed:', error.message);
      return [];
    }
  }

  // ============================================
  // PROFILE OPERATIONS
  // ============================================

  async saveProfile(profileData) {
    if (!this.canSync()) {
      this.queueSync('profile', 'upsert', { profileData });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('loom_profiles')
        .upsert({
          id: this.user.id,
          settings: profileData.settings || {},
          stats: profileData.stats || {},
          achievements: profileData.achievements || [],
          reading_streak: profileData.readingStreak || 0,
          last_read_date: profileData.lastReadDate
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[Cloud] Save profile failed:', error.message);
      return null;
    }
  }

  async loadProfile() {
    if (!this.canSync()) return null;

    try {
      const { data, error } = await supabase
        .from('loom_profiles')
        .select('*')
        .eq('id', this.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return data;
    } catch (error) {
      console.error('[Cloud] Load profile failed:', error.message);
      return null;
    }
  }

  // ============================================
  // COLLECTION OPERATIONS
  // ============================================

  async saveCollections(collections) {
    if (!this.canSync()) {
      this.queueSync('collections', 'upsert', { collections });
      return false;
    }

    try {
      // Delete existing and insert new
      await supabase
        .from('loom_collections')
        .delete()
        .eq('user_id', this.user.id)
        .eq('is_default', false); // Keep defaults

      for (const col of collections) {
        if (col.isDefault) continue; // Skip defaults
        await supabase
          .from('loom_collections')
          .insert({
            user_id: this.user.id,
            name: col.name,
            description: col.description,
            color: col.color,
            story_ids: col.storyIds || [],
            is_default: false
          });
      }

      console.log('[Cloud] Collections saved');
      return true;
    } catch (error) {
      console.error('[Cloud] Save collections failed:', error.message);
      return false;
    }
  }

  async loadCollections() {
    if (!this.canSync()) return [];

    try {
      const { data, error } = await supabase
        .from('loom_collections')
        .select('*')
        .eq('user_id', this.user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[Cloud] Load collections failed:', error.message);
      return [];
    }
  }

  // ============================================
  // SYNC QUEUE (for offline support)
  // ============================================

  queueSync(type, operation, data) {
    this.syncQueue.push({
      type,
      operation,
      data,
      timestamp: Date.now()
    });

    // Save queue to localStorage for persistence
    localStorage.setItem('loomiverse_sync_queue', JSON.stringify(this.syncQueue));
    console.log('[Cloud] Queued for sync:', type, operation);
  }

  async processSyncQueue() {
    if (!this.canSync() || this.isSyncing) return;

    // Load queue from localStorage
    const savedQueue = localStorage.getItem('loomiverse_sync_queue');
    if (savedQueue) {
      this.syncQueue = JSON.parse(savedQueue);
    }

    if (this.syncQueue.length === 0) return;

    this.isSyncing = true;
    console.log('[Cloud] Processing sync queue:', this.syncQueue.length, 'items');

    const failedItems = [];

    for (const item of this.syncQueue) {
      try {
        switch (item.type) {
          case 'story':
            if (item.operation === 'upsert') {
              await this.saveStory(item.data.localId, item.data.data);
            } else if (item.operation === 'delete') {
              await this.deleteStory(item.data.localId);
            }
            break;
          case 'character':
            await this.saveCharacter(item.data.charData);
            break;
          case 'profile':
            await this.saveProfile(item.data.profileData);
            break;
          case 'collections':
            await this.saveCollections(item.data.collections);
            break;
        }
      } catch (error) {
        console.error('[Cloud] Sync item failed:', error);
        failedItems.push(item);
      }
    }

    this.syncQueue = failedItems;
    localStorage.setItem('loomiverse_sync_queue', JSON.stringify(this.syncQueue));
    this.isSyncing = false;

    console.log('[Cloud] Sync complete. Failed items:', failedItems.length);
  }

  // ============================================
  // FULL SYNC (on login)
  // ============================================

  async syncAllFromLocal() {
    if (!this.canSync()) return;

    console.log('[Cloud] Starting full sync from localStorage...');

    // Get all local stories
    const prefix = 'loomiverse_';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key?.startsWith(prefix + 'story_')) {
        try {
          const localId = key.replace(prefix + 'story_', '');
          const data = JSON.parse(localStorage.getItem(key));
          await this.saveStory(localId, data);
        } catch (e) {
          console.error('[Cloud] Failed to sync story:', key, e);
        }
      }
    }

    // Sync characters
    const chars = localStorage.getItem(prefix + 'characters');
    if (chars) {
      try {
        const charList = JSON.parse(chars);
        for (const char of charList) {
          await this.saveCharacter(char);
        }
      } catch (e) {
        console.error('[Cloud] Failed to sync characters:', e);
      }
    }

    // Sync user profile
    const profile = localStorage.getItem(prefix + 'user_profile');
    if (profile) {
      try {
        await this.saveProfile(JSON.parse(profile));
      } catch (e) {
        console.error('[Cloud] Failed to sync profile:', e);
      }
    }

    console.log('[Cloud] Full sync complete');
  }

  // ============================================
  // STORY SHARING
  // ============================================

  /**
   * Generate a unique 8-character share code
   */
  generateShareCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like O/0, I/1
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  /**
   * Share a story publicly
   * @param {string} localId - Local story ID
   * @param {object} storyData - Story data to share
   * @returns {Promise<{code: string, url: string} | null>}
   */
  async shareStory(localId, storyData) {
    // Generate a share code
    const shareCode = this.generateShareCode();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    try {
      const { data, error } = await supabase
        .from('loom_shared_stories')
        .insert({
          share_code: shareCode,
          title: storyData.bible?.title || 'Untitled Story',
          genre: storyData.bible?.genre || 'Unknown',
          logline: storyData.bible?.logline || '',
          author_name: storyData.authorName || 'Anonymous Loominary',
          bible: storyData.bible,
          generated_chapters: storyData.generatedChapters || [],
          total_chapters: storyData.bible?.totalChapters || 10,
          cover_gradient: storyData.coverGradient,
          expires_at: expiresAt.toISOString(),
          view_count: 0,
          user_id: this.user?.id || null
        })
        .select()
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/share/${shareCode}`;
      console.log('[Cloud] Story shared:', shareCode);
      return { code: shareCode, url: shareUrl, expiresAt };
    } catch (error) {
      console.error('[Cloud] Share story failed:', error.message);
      return null;
    }
  }

  /**
   * Load a shared story by its share code (public, no auth required)
   * @param {string} shareCode - 8-character share code
   */
  async loadSharedStory(shareCode) {
    try {
      // Increment view count and get story
      const { data, error } = await supabase
        .from('loom_shared_stories')
        .select('*')
        .eq('share_code', shareCode.toUpperCase())
        .single();

      if (error) throw error;

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        console.log('[Cloud] Shared story expired:', shareCode);
        return null;
      }

      // Update view count in background
      supabase
        .from('loom_shared_stories')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('share_code', shareCode.toUpperCase())
        .then(() => {});

      return data;
    } catch (error) {
      console.error('[Cloud] Load shared story failed:', error.message);
      return null;
    }
  }

  /**
   * List stories shared by current user
   */
  async listMySharedStories() {
    if (!this.canSync()) return [];

    try {
      const { data, error } = await supabase
        .from('loom_shared_stories')
        .select('share_code, title, genre, view_count, created_at, expires_at')
        .eq('user_id', this.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[Cloud] List shared stories failed:', error.message);
      return [];
    }
  }

  /**
   * Delete a shared story
   */
  async deleteSharedStory(shareCode) {
    if (!this.canSync()) return false;

    try {
      const { error } = await supabase
        .from('loom_shared_stories')
        .delete()
        .eq('share_code', shareCode)
        .eq('user_id', this.user.id);

      if (error) throw error;
      console.log('[Cloud] Shared story deleted:', shareCode);
      return true;
    } catch (error) {
      console.error('[Cloud] Delete shared story failed:', error.message);
      return false;
    }
  }

  // ============================================
  // COLLABORATIVE STORIES
  // ============================================

  /**
   * Generate a 6-character session code for collaboration
   */
  generateSessionCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  /**
   * Create a new collaborative story session
   * @param {object} options - Session options
   * @returns {Promise<object|null>} - Session data or null
   */
  async createCollabSession(options = {}) {
    if (!this.canSync()) {
      console.error('[Collab] Must be signed in to create sessions');
      return null;
    }

    const sessionCode = this.generateSessionCode();
    const displayName = options.displayName || this.user.email?.split('@')[0] || 'Loominary';

    try {
      // Create the session
      const { data: session, error: sessionError } = await supabase
        .from('loom_collab_sessions')
        .insert({
          session_code: sessionCode,
          host_id: this.user.id,
          title: options.title || 'Collaborative Story',
          genre: options.genre || null,
          status: 'waiting', // waiting, active, paused, completed
          settings: {
            maxParticipants: options.maxParticipants || 4,
            turnTimeLimit: options.turnTimeLimit || null, // minutes, null = no limit
            allowSpectators: options.allowSpectators || false,
            autoAdvanceTurn: options.autoAdvanceTurn || true
          },
          bible: options.bible || null,
          generated_chapters: [],
          current_turn_index: 0,
          turn_order: [this.user.id]
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Add host as first participant
      const { error: participantError } = await supabase
        .from('loom_collab_participants')
        .insert({
          session_id: session.id,
          user_id: this.user.id,
          display_name: displayName,
          role: 'host',
          status: 'active',
          contributions_count: 0
        });

      if (participantError) throw participantError;

      console.log('[Collab] Session created:', sessionCode);
      return {
        ...session,
        isHost: true,
        participants: [{
          user_id: this.user.id,
          display_name: displayName,
          role: 'host',
          status: 'active'
        }]
      };
    } catch (error) {
      console.error('[Collab] Create session failed:', error.message);
      return null;
    }
  }

  /**
   * Join an existing collaborative session
   * @param {string} sessionCode - 6-character session code
   * @param {string} displayName - Display name for participant
   */
  async joinCollabSession(sessionCode, displayName) {
    if (!this.canSync()) {
      console.error('[Collab] Must be signed in to join sessions');
      return { error: 'Must be signed in' };
    }

    try {
      // Find the session
      const { data: session, error: findError } = await supabase
        .from('loom_collab_sessions')
        .select('*')
        .eq('session_code', sessionCode.toUpperCase())
        .single();

      if (findError || !session) {
        return { error: 'Session not found' };
      }

      if (session.status === 'completed') {
        return { error: 'Session has ended' };
      }

      // Check if already a participant
      const { data: existingParticipant } = await supabase
        .from('loom_collab_participants')
        .select('*')
        .eq('session_id', session.id)
        .eq('user_id', this.user.id)
        .single();

      if (existingParticipant) {
        // Rejoin - update status
        await supabase
          .from('loom_collab_participants')
          .update({ status: 'active', last_active_at: new Date().toISOString() })
          .eq('id', existingParticipant.id);

        return { session, isHost: session.host_id === this.user.id };
      }

      // Check participant limit
      const { data: participants } = await supabase
        .from('loom_collab_participants')
        .select('*')
        .eq('session_id', session.id)
        .eq('status', 'active');

      const maxParticipants = session.settings?.maxParticipants || 4;
      if (participants && participants.length >= maxParticipants) {
        return { error: 'Session is full' };
      }

      // Add as participant
      const name = displayName || this.user.email?.split('@')[0] || 'Loominary';
      const { error: joinError } = await supabase
        .from('loom_collab_participants')
        .insert({
          session_id: session.id,
          user_id: this.user.id,
          display_name: name,
          role: 'contributor',
          status: 'active',
          contributions_count: 0
        });

      if (joinError) throw joinError;

      // Add to turn order
      const newTurnOrder = [...(session.turn_order || []), this.user.id];
      await supabase
        .from('loom_collab_sessions')
        .update({ turn_order: newTurnOrder })
        .eq('id', session.id);

      console.log('[Collab] Joined session:', sessionCode);
      return { session: { ...session, turn_order: newTurnOrder }, isHost: false };
    } catch (error) {
      console.error('[Collab] Join session failed:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Get session details with participants
   * @param {string} sessionId - Session UUID
   */
  async getCollabSession(sessionId) {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('loom_collab_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      const { data: participants, error: participantsError } = await supabase
        .from('loom_collab_participants')
        .select('*')
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true });

      if (participantsError) throw participantsError;

      const { data: contributions } = await supabase
        .from('loom_collab_contributions')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      return {
        ...session,
        participants: participants || [],
        contributions: contributions || [],
        isHost: session.host_id === this.user?.id,
        isMyTurn: session.turn_order?.[session.current_turn_index] === this.user?.id
      };
    } catch (error) {
      console.error('[Collab] Get session failed:', error.message);
      return null;
    }
  }

  /**
   * Get session by code (for joining)
   */
  async getCollabSessionByCode(sessionCode) {
    try {
      const { data: session, error } = await supabase
        .from('loom_collab_sessions')
        .select('id, session_code, title, genre, status, settings, host_id')
        .eq('session_code', sessionCode.toUpperCase())
        .single();

      if (error) return null;

      // Get participant count
      const { count } = await supabase
        .from('loom_collab_participants')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id)
        .eq('status', 'active');

      return {
        ...session,
        participantCount: count || 0,
        maxParticipants: session.settings?.maxParticipants || 4
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Submit a contribution (chapter content, choice, etc.)
   */
  async submitContribution(sessionId, content, contentType = 'chapter') {
    if (!this.canSync()) return { error: 'Must be signed in' };

    try {
      // Get current session state
      const session = await this.getCollabSession(sessionId);
      if (!session) return { error: 'Session not found' };

      // Verify it's this user's turn
      if (!session.isMyTurn) {
        return { error: "It's not your turn" };
      }

      // Add contribution
      const { data: contribution, error: contribError } = await supabase
        .from('loom_collab_contributions')
        .insert({
          session_id: sessionId,
          user_id: this.user.id,
          chapter_number: (session.generated_chapters?.length || 0) + 1,
          content_type: contentType,
          content: content
        })
        .select()
        .single();

      if (contribError) throw contribError;

      // Update session: add to chapters and advance turn
      const newChapters = [...(session.generated_chapters || []), content];
      const nextTurnIndex = (session.current_turn_index + 1) % session.turn_order.length;

      await supabase
        .from('loom_collab_sessions')
        .update({
          generated_chapters: newChapters,
          current_turn_index: nextTurnIndex,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      // Update participant's contribution count
      await supabase
        .from('loom_collab_participants')
        .update({
          contributions_count: (session.participants.find(p => p.user_id === this.user.id)?.contributions_count || 0) + 1,
          last_active_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('user_id', this.user.id);

      console.log('[Collab] Contribution submitted');
      return { success: true, contribution };
    } catch (error) {
      console.error('[Collab] Submit contribution failed:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Update session status (host only)
   */
  async updateCollabSessionStatus(sessionId, status) {
    if (!this.canSync()) return false;

    try {
      const { error } = await supabase
        .from('loom_collab_sessions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('host_id', this.user.id);

      if (error) throw error;
      console.log('[Collab] Session status updated:', status);
      return true;
    } catch (error) {
      console.error('[Collab] Update status failed:', error.message);
      return false;
    }
  }

  /**
   * Update session bible (host only)
   */
  async updateCollabSessionBible(sessionId, bible) {
    if (!this.canSync()) return false;

    try {
      const { error } = await supabase
        .from('loom_collab_sessions')
        .update({ bible, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('host_id', this.user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[Collab] Update bible failed:', error.message);
      return false;
    }
  }

  /**
   * Leave a collaborative session
   */
  async leaveCollabSession(sessionId) {
    if (!this.canSync()) return false;

    try {
      await supabase
        .from('loom_collab_participants')
        .update({ status: 'left', last_active_at: new Date().toISOString() })
        .eq('session_id', sessionId)
        .eq('user_id', this.user.id);

      // Remove from turn order
      const { data: session } = await supabase
        .from('loom_collab_sessions')
        .select('turn_order, current_turn_index, host_id')
        .eq('id', sessionId)
        .single();

      if (session) {
        const newTurnOrder = session.turn_order.filter(id => id !== this.user.id);
        let newTurnIndex = session.current_turn_index;

        // Adjust turn index if needed
        const myIndex = session.turn_order.indexOf(this.user.id);
        if (myIndex < session.current_turn_index) {
          newTurnIndex = Math.max(0, session.current_turn_index - 1);
        } else if (myIndex === session.current_turn_index) {
          newTurnIndex = newTurnIndex % Math.max(1, newTurnOrder.length);
        }

        await supabase
          .from('loom_collab_sessions')
          .update({ turn_order: newTurnOrder, current_turn_index: newTurnIndex })
          .eq('id', sessionId);
      }

      console.log('[Collab] Left session');
      return true;
    } catch (error) {
      console.error('[Collab] Leave session failed:', error.message);
      return false;
    }
  }

  /**
   * List user's active collaborative sessions
   */
  async listMyCollabSessions() {
    if (!this.canSync()) return [];

    try {
      // Get sessions where user is a participant
      const { data: participations } = await supabase
        .from('loom_collab_participants')
        .select('session_id')
        .eq('user_id', this.user.id)
        .eq('status', 'active');

      if (!participations || participations.length === 0) return [];

      const sessionIds = participations.map(p => p.session_id);

      const { data: sessions, error } = await supabase
        .from('loom_collab_sessions')
        .select('*')
        .in('id', sessionIds)
        .neq('status', 'completed')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (sessions || []).map(s => ({
        ...s,
        isHost: s.host_id === this.user.id
      }));
    } catch (error) {
      console.error('[Collab] List sessions failed:', error.message);
      return [];
    }
  }

  /**
   * Subscribe to real-time session updates
   * @param {string} sessionId - Session UUID
   * @param {function} onUpdate - Callback for updates
   * @returns {function} - Unsubscribe function
   */
  subscribeToSession(sessionId, onUpdate) {
    const channel = supabase
      .channel(`collab_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loom_collab_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          console.log('[Collab] Session update:', payload.eventType);
          onUpdate({ type: 'session', data: payload.new });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'loom_collab_participants',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('[Collab] New participant:', payload.new.display_name);
          onUpdate({ type: 'participant_joined', data: payload.new });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'loom_collab_participants',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          if (payload.new.status === 'left') {
            onUpdate({ type: 'participant_left', data: payload.new });
          } else {
            onUpdate({ type: 'participant_update', data: payload.new });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'loom_collab_contributions',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('[Collab] New contribution');
          onUpdate({ type: 'contribution', data: payload.new });
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  }

  // ============================================
  // ENHANCED COLLAB: VOTING SYSTEM
  // ============================================

  /**
   * Cast a vote for a story choice
   */
  async castVote(sessionId, chapterNumber, choiceIndex) {
    if (!this.canSync()) return { error: 'Must be signed in' };

    try {
      // Upsert vote (allows changing vote)
      const { data, error } = await supabase
        .from('loom_collab_votes')
        .upsert({
          session_id: sessionId,
          chapter_number: chapterNumber,
          user_id: this.user.id,
          choice_index: choiceIndex
        }, {
          onConflict: 'session_id,chapter_number,user_id'
        })
        .select()
        .single();

      if (error) throw error;

      // Also update the session's votes JSONB for quick access
      const { data: session } = await supabase
        .from('loom_collab_sessions')
        .select('votes')
        .eq('id', sessionId)
        .single();

      const votes = session?.votes || {};
      votes[this.user.id] = choiceIndex;

      await supabase
        .from('loom_collab_sessions')
        .update({ votes })
        .eq('id', sessionId);

      console.log('[Collab] Vote cast:', choiceIndex);
      return { success: true, vote: data };
    } catch (error) {
      console.error('[Collab] Cast vote failed:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Get vote counts for current chapter
   */
  async getVoteCounts(sessionId, chapterNumber) {
    try {
      const { data, error } = await supabase
        .from('loom_collab_votes')
        .select('choice_index')
        .eq('session_id', sessionId)
        .eq('chapter_number', chapterNumber);

      if (error) throw error;

      // Count votes
      const counts = { 0: 0, 1: 0, 2: 0 };
      data?.forEach(v => {
        counts[v.choice_index] = (counts[v.choice_index] || 0) + 1;
      });

      return counts;
    } catch (error) {
      console.error('[Collab] Get vote counts failed:', error.message);
      return { 0: 0, 1: 0, 2: 0 };
    }
  }

  /**
   * Start voting on choices (host only)
   */
  async startVoting(sessionId, choices, timerSeconds = 60) {
    if (!this.canSync()) return false;

    try {
      const deadline = timerSeconds
        ? new Date(Date.now() + timerSeconds * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('loom_collab_sessions')
        .update({
          current_choices: choices,
          voting_active: true,
          votes: {},
          voting_deadline: deadline,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('host_id', this.user.id);

      if (error) throw error;
      console.log('[Collab] Voting started');
      return true;
    } catch (error) {
      console.error('[Collab] Start voting failed:', error.message);
      return false;
    }
  }

  /**
   * End voting and determine winner (host only)
   */
  async endVoting(sessionId) {
    if (!this.canSync()) return { error: 'Must be signed in' };

    try {
      // Get session and votes
      const session = await this.getCollabSession(sessionId);
      if (!session) return { error: 'Session not found' };
      if (!session.isHost) return { error: 'Only host can end voting' };

      // Count votes
      const voteCounts = await this.getVoteCounts(sessionId, session.current_chapter_number);

      // Find winner (highest votes, tie goes to lower index)
      let winnerIndex = 0;
      let maxVotes = voteCounts[0] || 0;

      for (let i = 1; i <= 2; i++) {
        if ((voteCounts[i] || 0) > maxVotes) {
          maxVotes = voteCounts[i];
          winnerIndex = i;
        }
      }

      // Update session
      const { error } = await supabase
        .from('loom_collab_sessions')
        .update({
          voting_active: false,
          voting_deadline: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      return {
        success: true,
        winnerIndex,
        winnerChoice: session.current_choices?.[winnerIndex],
        voteCounts
      };
    } catch (error) {
      console.error('[Collab] End voting failed:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Update current chapter content (host only, after AI generates)
   */
  async updateCollabChapter(sessionId, chapterNumber, content, choices) {
    if (!this.canSync()) return false;

    try {
      const { error } = await supabase
        .from('loom_collab_sessions')
        .update({
          current_chapter_number: chapterNumber,
          current_chapter_content: content,
          current_choices: choices,
          voting_active: false,
          votes: {},
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('host_id', this.user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[Collab] Update chapter failed:', error.message);
      return false;
    }
  }

  // ============================================
  // ENHANCED COLLAB: LIVE CHAT
  // ============================================

  /**
   * Send a chat message
   */
  async sendChatMessage(sessionId, message, messageType = 'chat', characterName = null) {
    if (!this.canSync()) return { error: 'Must be signed in' };

    try {
      const displayName = this.user.email?.split('@')[0] || 'Loominary';

      const { data, error } = await supabase
        .from('loom_collab_chat')
        .insert({
          session_id: sessionId,
          user_id: this.user.id,
          display_name: displayName,
          message,
          message_type: messageType,
          character_name: characterName
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, message: data };
    } catch (error) {
      console.error('[Collab] Send message failed:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Get recent chat messages
   */
  async getChatMessages(sessionId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('loom_collab_chat')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[Collab] Get messages failed:', error.message);
      return [];
    }
  }

  // ============================================
  // ENHANCED COLLAB: CHARACTER CLAIMING
  // ============================================

  /**
   * Claim a character to roleplay as
   */
  async claimCharacter(sessionId, characterId, characterName) {
    if (!this.canSync()) return { error: 'Must be signed in' };

    try {
      // Update participant record
      await supabase
        .from('loom_collab_participants')
        .update({
          claimed_character_id: characterId,
          claimed_character_name: characterName,
          last_active_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('user_id', this.user.id);

      // Also update session's claimed_characters for quick access
      const { data: session } = await supabase
        .from('loom_collab_sessions')
        .select('claimed_characters')
        .eq('id', sessionId)
        .single();

      const claimed = session?.claimed_characters || {};
      claimed[this.user.id] = { characterId, characterName };

      await supabase
        .from('loom_collab_sessions')
        .update({ claimed_characters: claimed })
        .eq('id', sessionId);

      console.log('[Collab] Character claimed:', characterName);
      return { success: true };
    } catch (error) {
      console.error('[Collab] Claim character failed:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Release a claimed character
   */
  async releaseCharacter(sessionId) {
    if (!this.canSync()) return false;

    try {
      await supabase
        .from('loom_collab_participants')
        .update({
          claimed_character_id: null,
          claimed_character_name: null
        })
        .eq('session_id', sessionId)
        .eq('user_id', this.user.id);

      // Update session's claimed_characters
      const { data: session } = await supabase
        .from('loom_collab_sessions')
        .select('claimed_characters')
        .eq('id', sessionId)
        .single();

      const claimed = session?.claimed_characters || {};
      delete claimed[this.user.id];

      await supabase
        .from('loom_collab_sessions')
        .update({ claimed_characters: claimed })
        .eq('id', sessionId);

      return true;
    } catch (error) {
      console.error('[Collab] Release character failed:', error.message);
      return false;
    }
  }

  /**
   * Enhanced subscribe with chat and votes
   */
  subscribeToSessionEnhanced(sessionId, onUpdate) {
    const channel = supabase
      .channel(`collab_enhanced_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loom_collab_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          console.log('[Collab] Session update:', payload.eventType);
          onUpdate({ type: 'session', data: payload.new });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loom_collab_participants',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('[Collab] Participant update');
          onUpdate({ type: 'participant', data: payload.new, event: payload.eventType });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'loom_collab_chat',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('[Collab] New chat message');
          onUpdate({ type: 'chat', data: payload.new });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loom_collab_votes',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('[Collab] Vote update');
          onUpdate({ type: 'vote', data: payload.new, event: payload.eventType });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Pull from cloud to local (for new device)
  async syncAllToLocal() {
    if (!this.canSync()) return;

    console.log('[Cloud] Pulling from cloud to localStorage...');
    const prefix = 'loomiverse_';

    // Get cloud stories
    const stories = await this.listStories(true);
    for (const story of stories) {
      const localKey = prefix + 'story_' + story.local_id;
      const localData = {
        bible: story.bible,
        currentChapter: story.current_chapter,
        generatedChapters: story.generated_chapters,
        coverGradient: story.cover_gradient,
        status: story.status,
        bookmarks: story.bookmarks,
        lastPlayed: story.updated_at
      };
      localStorage.setItem(localKey, JSON.stringify(localData));
    }

    // Get cloud characters
    const characters = await this.listCharacters();
    if (characters.length > 0) {
      localStorage.setItem(prefix + 'characters', JSON.stringify(
        characters.map(c => c.data)
      ));
    }

    // Get cloud profile
    const profile = await this.loadProfile();
    if (profile) {
      localStorage.setItem(prefix + 'user_profile', JSON.stringify({
        settings: profile.settings,
        stats: profile.stats,
        achievements: profile.achievements,
        readingStreak: profile.reading_streak,
        lastReadDate: profile.last_read_date
      }));
    }

    console.log('[Cloud] Pull complete');
  }
}

// Export singleton
export const cloudStorage = new CloudStorageManager();
export default cloudStorage;
