# 🚀 RAG AI Coach Setup Guide

This guide will walk you through setting up the complete RAG (Retrieval-Augmented Generation) AI Coach system for your Digm app.

## 📋 Prerequisites

- ✅ React Native/Expo app (already set up)
- ✅ Supabase project with authentication
- ✅ OpenAI API key
- ✅ Python 3.8+ installed
- ✅ Node.js and npm/yarn

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │   Python        │    │   Supabase      │
│   App (iOS)     │◄──►│   FastAPI       │◄──►│   + pgvector    │
│                 │    │   Backend       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Step 1: Supabase Setup

### 1.1 Enable pgvector Extension

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the following command:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Note**: This may take a few minutes to complete.

### 1.2 Run Database Setup Scripts

1. In the SQL Editor, copy and paste the entire contents of `supabase_setup.sql`
2. Click **Run** to execute all the scripts
3. Verify the setup by running:

```sql
-- Check if pgvector is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if user_embeddings table was created
\dt user_embeddings

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_embeddings';
```

## 🐍 Step 2: Python Backend Setup

### 2.1 Navigate to Backend Directory

```bash
cd backend
```

### 2.2 Set Up Environment Variables

1. Copy your `.env` file and update it with real values:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-actual-supabase-anon-key

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

### 2.3 Install Dependencies

```bash
# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2.4 Start the Backend Server

```bash
# Option 1: Use startup script
./start.sh

# Option 2: Manual start
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2.5 Test the Backend

```bash
# In a new terminal, run the test script
cd backend
python test_api.py
```

You should see:
```
🚀 Testing Digm AI Coach API
========================================
🔍 Testing health endpoints...
✅ Root endpoint: 200 - {'message': 'Digm AI Coach API is running!'}
✅ Health endpoint: 200 - {'status': 'healthy', 'timestamp': '2024-01-01T00:00:00Z'}

🔍 Testing coach endpoint without authentication...
✅ Coach endpoint (no auth): 401 - {'detail': 'Not authenticated'}

🔍 Testing embeddings endpoint without authentication...
✅ Embeddings endpoint (no auth): 401 - {'detail': 'Not authenticated'}

========================================
✅ Basic API tests completed!
```

## 📱 Step 3: React Native Integration

### 3.1 Update Environment Variables

Make sure your React Native app has the correct Supabase credentials in `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-supabase-anon-key
```

### 3.2 Test the Integration

1. Start your React Native app:
```bash
npx expo start
```

2. Navigate to the **Coach** tab
3. You should see the new AI Coach interface with:
   - Brain icon and "AI Coach" title
   - "Update AI" button for generating embeddings
   - Updated placeholder text: "Ask your AI coach anything..."

## 🧪 Step 4: Testing the Complete System

### 4.1 Generate Embeddings

1. In the Coach tab, tap the **"Update AI"** button
2. This will generate embeddings for all your user data
3. You should see a success message with the number of embeddings created

### 4.2 Test AI Coach Responses

1. Type a message like: "I need help staying motivated with my goals"
2. The AI should respond with personalized advice based on your data
3. Check the console logs to see the RAG process in action

### 4.3 Verify Data Isolation

1. Create a test account with different user ID
2. Verify that the AI coach only has access to that user's data
3. Check that embeddings are properly isolated by user

## 🔍 Step 5: Monitoring and Debugging

### 5.1 Backend Logs

Watch the Python backend console for:
- Authentication attempts
- Embedding generation progress
- AI response generation
- Any errors or warnings

### 5.2 React Native Logs

Check the Expo console for:
- API call responses
- Authentication token handling
- UI state changes

### 5.3 Supabase Logs

In Supabase Dashboard > Logs, monitor:
- Database queries
- RLS policy enforcement
- Vector similarity searches

## 🚀 Step 6: Production Deployment

### 6.1 Backend Deployment

Choose a platform:
- **Railway**: Easy deployment, good free tier
- **Render**: Simple setup, free tier available
- **Heroku**: Classic choice, requires credit card
- **AWS Lambda**: Serverless, pay-per-use

### 6.2 Update React Native App

1. Change the backend URL in `useAICoach.ts`:
```typescript
const getBackendUrl = () => {
  return __DEV__ 
    ? 'http://localhost:8000' 
    : 'https://your-production-backend.com';
};
```

2. Update CORS settings in the backend for production

### 6.3 Environment Variables

Set production environment variables:
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## 🎯 Advanced Features

### 6.1 Custom Coaching Styles

Modify the system prompt in `main.py` to change the AI's personality:
```python
def build_system_prompt(user_context: Dict, relevant_data: List[Dict]) -> str:
    # Customize the coaching style here
    return f"""
    You are a {user_context.get('coaching_style', 'motivational')} AI coach...
    """
```

### 6.2 Embedding Optimization

1. **Batch Processing**: Process multiple users simultaneously
2. **Incremental Updates**: Only regenerate embeddings for changed content
3. **Caching**: Cache frequently accessed embeddings

### 6.3 Performance Monitoring

1. **Response Times**: Monitor AI response generation speed
2. **Vector Search**: Track similarity search performance
3. **API Usage**: Monitor OpenAI API costs and usage

## 🐛 Troubleshooting

### Common Issues

1. **pgvector Extension Not Available**
   - Wait a few minutes after enabling
   - Check Supabase project region compatibility

2. **Authentication Errors**
   - Verify JWT token format
   - Check Supabase RLS policies
   - Ensure user is properly authenticated

3. **OpenAI API Errors**
   - Verify API key is correct
   - Check API usage limits
   - Ensure account has credits

4. **Vector Search Not Working**
   - Verify embeddings were generated
   - Check the `match_documents` function
   - Test with simple queries first

### Debug Commands

```bash
# Check backend status
curl http://localhost:8000/health

# Test authentication (replace with real token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/coach/query \
  -d '{"message": "test"}'

# Check Supabase embeddings
SELECT COUNT(*) FROM user_embeddings WHERE user_id = 'your-user-id';
```

## 📚 Next Steps

1. **Customize Coaching Style**: Modify prompts for your app's tone
2. **Add More Data Sources**: Include habits, achievements, etc.
3. **Implement Caching**: Cache AI responses for common queries
4. **Add Analytics**: Track coaching effectiveness and user engagement
5. **Multi-language Support**: Extend to other languages
6. **Voice Integration**: Add speech-to-text for hands-free coaching

## 🎉 Congratulations!

You now have a fully functional RAG AI Coach system that:
- ✅ Provides personalized coaching based on user data
- ✅ Maintains complete data privacy and security
- ✅ Scales efficiently with vector similarity search
- ✅ Integrates seamlessly with your React Native app
- ✅ Is ready for production deployment

The AI Coach will now understand each user's goals, tasks, journal entries, and provide truly personalized guidance! 🚀
