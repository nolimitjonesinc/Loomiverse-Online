-- Enhanced Collaborative Stories: Voting, Chat, Character Claiming
-- Run this AFTER 003_collaborative_stories.sql

-- Update sessions table with new fields
ALTER TABLE loom_collab_sessions
ADD COLUMN IF NOT EXISTS current_chapter_number INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_chapter_content TEXT,
ADD COLUMN IF NOT EXISTS current_choices JSONB, -- Array of choice objects
ADD COLUMN IF NOT EXISTS voting_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vote_timer_seconds INTEGER DEFAULT 60, -- null = no timer
ADD COLUMN IF NOT EXISTS votes JSONB DEFAULT '{}'::jsonb, -- { odId: choiceIndex }
ADD COLUMN IF NOT EXISTS voting_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS claimed_characters JSONB DEFAULT '{}'::jsonb; -- { odId: characterId }

-- Update participants table
ALTER TABLE loom_collab_participants
ADD COLUMN IF NOT EXISTS claimed_character_id TEXT,
ADD COLUMN IF NOT EXISTS claimed_character_name TEXT,
ADD COLUMN IF NOT EXISTS is_spectator BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_vote INTEGER; -- 0, 1, or 2 for choice index

-- Chat messages table
CREATE TABLE IF NOT EXISTS loom_collab_chat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES loom_collab_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'chat' CHECK (message_type IN ('chat', 'reaction', 'system', 'character')),
  character_name TEXT, -- If speaking as a character
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table (detailed tracking)
CREATE TABLE IF NOT EXISTS loom_collab_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES loom_collab_sessions(id) ON DELETE CASCADE NOT NULL,
  chapter_number INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  choice_index INTEGER NOT NULL CHECK (choice_index >= 0 AND choice_index <= 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, chapter_number, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collab_chat_session ON loom_collab_chat(session_id);
CREATE INDEX IF NOT EXISTS idx_collab_chat_created ON loom_collab_chat(created_at);
CREATE INDEX IF NOT EXISTS idx_collab_votes_session ON loom_collab_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_collab_votes_chapter ON loom_collab_votes(session_id, chapter_number);

-- Enable RLS on new tables
ALTER TABLE loom_collab_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE loom_collab_votes ENABLE ROW LEVEL SECURITY;

-- RLS for Chat
CREATE POLICY "Chat viewable by session members" ON loom_collab_chat
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loom_collab_participants p
      WHERE p.session_id = loom_collab_chat.session_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send chat messages" ON loom_collab_chat
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS for Votes
CREATE POLICY "Votes viewable by session members" ON loom_collab_votes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loom_collab_participants p
      WHERE p.session_id = loom_collab_votes.session_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can cast votes" ON loom_collab_votes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can change their vote" ON loom_collab_votes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Enable Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE loom_collab_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE loom_collab_votes;

-- Function to count votes and determine winner
CREATE OR REPLACE FUNCTION get_vote_counts(p_session_id UUID, p_chapter_number INTEGER)
RETURNS TABLE(choice_index INTEGER, vote_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT v.choice_index, COUNT(*) as vote_count
  FROM loom_collab_votes v
  WHERE v.session_id = p_session_id AND v.chapter_number = p_chapter_number
  GROUP BY v.choice_index
  ORDER BY vote_count DESC, choice_index ASC;
END;
$$ LANGUAGE plpgsql;
