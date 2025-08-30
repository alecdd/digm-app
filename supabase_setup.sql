-- Digm AI Coach - Supabase Setup Scripts
-- Run these in your Supabase SQL Editor

-- 1. Enable the pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create user_embeddings table for storing AI embeddings
CREATE TABLE IF NOT EXISTS user_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'goal', 'task', 'journal', 'profile'
  content_id UUID NOT NULL, -- reference to original table
  content_text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create index for faster vector similarity search
CREATE INDEX IF NOT EXISTS idx_user_embeddings_user_id ON user_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_embeddings_content_type ON user_embeddings(content_type);
CREATE INDEX IF NOT EXISTS idx_user_embeddings_embedding ON user_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE user_embeddings ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policy: users can only access their own embeddings
CREATE POLICY "Users can only access their own embeddings" ON user_embeddings
  FOR ALL USING (auth.uid() = user_id);

-- 6. Create function for vector similarity search with user isolation
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  user_id_filter uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content_type text,
  content_text text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Ensure user_id_filter is provided for security
  IF user_id_filter IS NULL THEN
    RAISE EXCEPTION 'user_id_filter is required for security';
  END IF;
  
  RETURN QUERY
  SELECT
    user_embeddings.id,
    user_embeddings.content_type,
    user_embeddings.content_text,
    user_embeddings.metadata,
    1 - (user_embeddings.embedding <=> query_embedding) AS similarity
  FROM user_embeddings
  WHERE 
    user_embeddings.user_id = user_id_filter
    AND 1 - (user_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY user_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 7. Create function to clean up old embeddings when content is deleted
CREATE OR REPLACE FUNCTION cleanup_embeddings()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete embeddings when the original content is deleted
  DELETE FROM user_embeddings 
  WHERE content_id = OLD.id AND content_type = TG_TABLE_NAME;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers to automatically clean up embeddings
-- Note: You'll need to create these triggers for each table that has embeddings
-- Example for goals table (adjust table names as needed):
-- CREATE TRIGGER cleanup_goal_embeddings
--   AFTER DELETE ON goals
--   FOR EACH ROW EXECUTE FUNCTION cleanup_embeddings();

-- 9. Create function to update embeddings when content changes
CREATE OR REPLACE FUNCTION update_embedding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to update timestamp
CREATE TRIGGER update_user_embeddings_timestamp
  BEFORE UPDATE ON user_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_embedding_timestamp();

-- 11. Create view for easy access to user data with embeddings
CREATE OR REPLACE VIEW user_data_with_embeddings AS
SELECT 
  ue.user_id,
  ue.content_type,
  ue.content_id,
  ue.content_text,
  ue.embedding,
  ue.metadata,
  ue.created_at,
  ue.updated_at,
  CASE 
    WHEN ue.content_type = 'goal' THEN g.title
    WHEN ue.content_type = 'task' THEN t.title
    WHEN ue.content_type = 'journal' THEN 'Journal Entry'
    WHEN ue.content_type = 'profile' THEN 'User Profile'
    ELSE 'Unknown'
  END as display_title
FROM user_embeddings ue
LEFT JOIN goals g ON ue.content_type = 'goal' AND ue.content_id = g.id
LEFT JOIN tasks t ON ue.content_type = 'task' AND ue.content_id = t.id;

-- 12. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON user_embeddings TO anon, authenticated;
GRANT EXECUTE ON FUNCTION match_documents TO anon, authenticated;

-- 13. Create function to get embedding statistics for a user
CREATE OR REPLACE FUNCTION get_user_embedding_stats(user_id_param uuid)
RETURNS TABLE (
  content_type text,
  count bigint,
  last_updated timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ue.content_type,
    COUNT(*) as count,
    MAX(ue.updated_at) as last_updated
  FROM user_embeddings ue
  WHERE ue.user_id = user_id_param
  GROUP BY ue.content_type
  ORDER BY ue.content_type;
END;
$$;

-- 14. Grant execute permission on stats function
GRANT EXECUTE ON FUNCTION get_user_embedding_stats TO anon, authenticated;

-- Verification queries (run these to check setup)
-- SELECT * FROM pg_extension WHERE extname = 'vector';
-- \dt user_embeddings
-- SELECT * FROM user_embeddings LIMIT 5;
-- SELECT * FROM get_user_embedding_stats('your-user-id-here');

-- Notes:
-- 1. Run this script in your Supabase SQL Editor
-- 2. The pgvector extension may take a few minutes to enable
-- 3. Adjust table names (goals, tasks, etc.) to match your actual schema
-- 4. Test the RLS policies with your user accounts
-- 5. Monitor the performance of vector searches in production
