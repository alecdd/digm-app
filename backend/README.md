# Digm AI Coach Backend

A FastAPI-based backend that provides RAG (Retrieval-Augmented Generation) capabilities for the Digm AI Coach application.

## Features

- **AI Coach API**: Personalized coaching responses using OpenAI GPT-4
- **RAG Integration**: Retrieval-augmented generation for context-aware responses
- **User Data Integration**: Access to user goals, tasks, journal entries, and profile
- **Secure Authentication**: JWT-based authentication with Supabase
- **Vector Search**: Embedding-based similarity search (coming soon with pgvector)

## Setup

### 1. Environment Variables

Create a `.env` file in the backend directory:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

### 2. Install Dependencies

```bash
# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Start the Server

```bash
# Option 1: Use the startup script
./start.sh

# Option 2: Manual start
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### Health Check
- `GET /` - Root endpoint
- `GET /health` - Health check

### AI Coach
- `POST /api/coach/query` - Query the AI coach
- `POST /api/embeddings/generate` - Generate embeddings for user data

## Usage

### Query the AI Coach

```bash
curl -X POST "http://localhost:8000/api/coach/query" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "I need help staying motivated with my goals"}'
```

### Generate Embeddings

```bash
curl -X POST "http://localhost:8000/api/embeddings/generate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user-uuid-here"}'
```

## Architecture

### Components

1. **FastAPI App** (`main.py`): Main application with endpoints
2. **RAG Service** (`rag_service.py`): Handles embeddings and vector search
3. **Authentication**: JWT-based auth with Supabase
4. **Data Integration**: Connects to Supabase for user data

### Data Flow

1. User sends message to `/api/coach/query`
2. Backend authenticates user via JWT
3. Fetches user context and relevant data
4. Generates personalized AI response
5. Returns response with relevant data context

## Next Steps

### 1. Enable pgvector in Supabase
```sql
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create user_embeddings table
CREATE TABLE user_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  content_text TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users can only access their own embeddings" ON user_embeddings
  FOR ALL USING (auth.uid() = user_id);
```

### 2. Vector Search Function
```sql
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id_filter uuid
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
```

## Development

### Running Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest
```

### Code Style
- Use Black for code formatting
- Follow PEP 8 guidelines
- Add type hints for all functions

## Deployment

### Local Development
- Port: 8000
- Auto-reload enabled
- CORS allows all origins

### Production
- Use Gunicorn or similar WSGI server
- Set proper CORS origins
- Enable HTTPS
- Set up proper logging
- Monitor API usage and costs
