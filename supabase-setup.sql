-- ============================================
-- LOOMIVERSE DATABASE SETUP
-- Run this in Supabase SQL Editor
-- Dashboard > SQL Editor > New Query
-- ============================================

-- 1. USER PROFILES (extends Supabase auth)
-- Stores user settings, stats, and preferences
CREATE TABLE IF NOT EXISTS loom_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  settings JSONB DEFAULT '{}',
  stats JSONB DEFAULT '{
    "storiesCreated": 0,
    "storiesCompleted": 0,
    "chaptersRead": 0,
    "choicesMade": 0,
    "totalReadingTime": 0
  }',
  achievements JSONB DEFAULT '[]',
  reading_streak INTEGER DEFAULT 0,
  last_read_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STORIES
-- Stores complete story data including bible, chapters, choices
CREATE TABLE IF NOT EXISTS loom_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id TEXT NOT NULL, -- matches localStorage key for sync
  title TEXT NOT NULL,
  genre TEXT,
  logline TEXT,
  bible JSONB NOT NULL, -- full StoryBible object
  current_chapter JSONB, -- current chapter data
  generated_chapters JSONB DEFAULT '[]', -- all generated chapter content
  cover_gradient TEXT, -- gradient colors for cover
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  bookmarks JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, local_id)
);

-- 3. CHARACTERS
-- Saved characters from stories or user-created
CREATE TABLE IF NOT EXISTS loom_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES loom_stories(id) ON DELETE SET NULL,
  local_story_id TEXT, -- for linking before story is synced
  name TEXT NOT NULL,
  role TEXT, -- protagonist, antagonist, supporting
  data JSONB NOT NULL, -- full character object with psychology
  origin TEXT DEFAULT 'story' CHECK (origin IN ('story', 'user', 'imported')),
  story_title TEXT, -- denormalized for display
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COLLECTIONS
-- User-created story collections/folders
CREATE TABLE IF NOT EXISTS loom_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#f59e0b', -- amber default
  story_ids TEXT[] DEFAULT '{}', -- array of local_ids for flexibility
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Users can only access their own data
-- ============================================

ALTER TABLE loom_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loom_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE loom_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE loom_collections ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own
CREATE POLICY "Users can view own profile" ON loom_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON loom_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON loom_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Stories: users can only see/edit their own
CREATE POLICY "Users can view own stories" ON loom_stories
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stories" ON loom_stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stories" ON loom_stories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own stories" ON loom_stories
  FOR DELETE USING (auth.uid() = user_id);

-- Characters: users can only see/edit their own
CREATE POLICY "Users can view own characters" ON loom_characters
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own characters" ON loom_characters
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own characters" ON loom_characters
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own characters" ON loom_characters
  FOR DELETE USING (auth.uid() = user_id);

-- Collections: users can only see/edit their own
CREATE POLICY "Users can view own collections" ON loom_collections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own collections" ON loom_collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON loom_collections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON loom_collections
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- INDEXES for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_loom_stories_user_id ON loom_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_loom_stories_status ON loom_stories(status);
CREATE INDEX IF NOT EXISTS idx_loom_stories_updated ON loom_stories(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_loom_characters_user_id ON loom_characters(user_id);
CREATE INDEX IF NOT EXISTS idx_loom_characters_story_id ON loom_characters(story_id);
CREATE INDEX IF NOT EXISTS idx_loom_collections_user_id ON loom_collections(user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
DROP TRIGGER IF EXISTS update_loom_profiles_updated_at ON loom_profiles;
CREATE TRIGGER update_loom_profiles_updated_at
  BEFORE UPDATE ON loom_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_loom_stories_updated_at ON loom_stories;
CREATE TRIGGER update_loom_stories_updated_at
  BEFORE UPDATE ON loom_stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_loom_characters_updated_at ON loom_characters;
CREATE TRIGGER update_loom_characters_updated_at
  BEFORE UPDATE ON loom_characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_loom_collections_updated_at ON loom_collections;
CREATE TRIGGER update_loom_collections_updated_at
  BEFORE UPDATE ON loom_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO loom_profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');

  -- Also create default collections
  INSERT INTO loom_collections (user_id, name, is_default)
  VALUES
    (NEW.id, 'Favorites', true),
    (NEW.id, 'Reading List', true),
    (NEW.id, 'Completed', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 5. FRIENDS MODE - STORY SESSIONS
-- Live multiplayer story sessions
-- ============================================

-- Story rooms for group storytelling
CREATE TABLE IF NOT EXISTS loom_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL, -- 6-char join code
  story_id UUID REFERENCES loom_stories(id) ON DELETE SET NULL,
  story_data JSONB, -- current story state
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'paused', 'ended')),
  max_players INTEGER DEFAULT 4,
  settings JSONB DEFAULT '{
    "votingEnabled": true,
    "turnBased": false,
    "allowSpectators": true
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session participants
CREATE TABLE IF NOT EXISTS loom_session_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES loom_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role TEXT DEFAULT 'player' CHECK (role IN ('host', 'player', 'spectator')),
  character_id UUID REFERENCES loom_characters(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Session messages (chat + story actions)
CREATE TABLE IF NOT EXISTS loom_session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES loom_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT DEFAULT 'chat' CHECK (type IN ('chat', 'action', 'choice', 'narration', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE loom_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loom_session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE loom_session_messages ENABLE ROW LEVEL SECURITY;

-- Sessions: anyone can view public sessions, only host can update
CREATE POLICY "Anyone can view sessions" ON loom_sessions
  FOR SELECT USING (true);
CREATE POLICY "Users can create sessions" ON loom_sessions
  FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update session" ON loom_sessions
  FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Host can delete session" ON loom_sessions
  FOR DELETE USING (auth.uid() = host_id);

-- Players: can see all players in sessions they're in
CREATE POLICY "Players can view session members" ON loom_session_players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM loom_session_players sp
      WHERE sp.session_id = loom_session_players.session_id
      AND sp.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can join sessions" ON loom_session_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own player status" ON loom_session_players
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave sessions" ON loom_session_players
  FOR DELETE USING (auth.uid() = user_id);

-- Messages: can see messages in sessions you're in
CREATE POLICY "Players can view session messages" ON loom_session_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM loom_session_players sp
      WHERE sp.session_id = loom_session_messages.session_id
      AND sp.user_id = auth.uid()
    )
  );
CREATE POLICY "Players can send messages" ON loom_session_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM loom_session_players sp
      WHERE sp.session_id = loom_session_messages.session_id
      AND sp.user_id = auth.uid()
    )
  );

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_loom_sessions_code ON loom_sessions(code);
CREATE INDEX IF NOT EXISTS idx_loom_sessions_host ON loom_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_loom_sessions_status ON loom_sessions(status);
CREATE INDEX IF NOT EXISTS idx_loom_session_players_session ON loom_session_players(session_id);
CREATE INDEX IF NOT EXISTS idx_loom_session_players_user ON loom_session_players(user_id);
CREATE INDEX IF NOT EXISTS idx_loom_session_messages_session ON loom_session_messages(session_id);

-- Triggers for sessions
DROP TRIGGER IF EXISTS update_loom_sessions_updated_at ON loom_sessions;
CREATE TRIGGER update_loom_sessions_updated_at
  BEFORE UPDATE ON loom_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate unique session code
CREATE OR REPLACE FUNCTION generate_session_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DONE! Tables are ready for Loomiverse
-- ============================================
