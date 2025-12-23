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

    // Listen for online/offline
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Check auth state on init
    this.initAuth();
  }

  async initAuth() {
    this.user = await getCurrentUser();

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      this.user = session?.user || null;
      if (this.user) {
        console.log('[Cloud] User signed in:', this.user.email);
        this.syncAllFromLocal(); // Sync local data to cloud on login
      }
    });
  }

  // Check if cloud sync is available
  canSync() {
    return this.isOnline && this.user !== null;
  }

  // ============================================
  // STORY OPERATIONS
  // ============================================

  async saveStory(localId, data) {
    if (!this.canSync()) {
      this.queueSync('story', 'upsert', { localId, data });
      return null;
    }

    try {
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

      if (error) throw error;
      console.log('[Cloud] Story saved:', data.bible?.title);
      return result;
    } catch (error) {
      console.error('[Cloud] Save story failed:', error.message);
      this.queueSync('story', 'upsert', { localId, data });
      return null;
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
