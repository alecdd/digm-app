from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv
import openai
from supabase import create_client, Client
import json
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Digm AI Coach API",
    description="RAG-powered AI Coach for personalized goal coaching",
    version="1.0.0"
)

# CORS middleware for React Native app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your app's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY environment variable is required")

supabase_url = os.getenv("SUPABASE_URL")
supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
if not supabase_url or not supabase_anon_key:
    raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required")

supabase: Client = create_client(supabase_url, supabase_anon_key)

# Security
security = HTTPBearer()

# Pydantic models
class CoachQuery(BaseModel):
    message: str
    chat_history: Optional[List[Dict]] = None  # Add chat history field

class CoachResponse(BaseModel):
    response: str
    relevant_data: List[Dict]
    user_context: Dict

class EmbeddingRequest(BaseModel):
    user_id: str

class EmbeddingResponse(BaseModel):
    message: str
    embeddings_generated: int

# Authentication middleware
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify Supabase JWT token and return user ID"""
    try:
        token = credentials.credentials
        # Verify the token with Supabase
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
        return user.user.id
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Digm AI Coach API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}

# RAG Coach endpoint
@app.post("/api/coach/query", response_model=CoachResponse)
async def query_coach(
    query: CoachQuery,
    user_id: str = Depends(get_current_user)
):
    """Main RAG endpoint for AI Coach queries"""
    try:
        logger.info(f"Processing coach query for user {user_id}")
        
        # Get user context
        user_context = await get_user_context(user_id)
        
        # Get relevant data using vector similarity
        relevant_data = await get_relevant_data(user_id, query.message)
        
        # Generate AI response
        ai_response = await generate_coach_response(user_context, relevant_data, query.message, query.chat_history)
        
        return CoachResponse(
            response=ai_response,
            relevant_data=relevant_data,
            user_context=user_context
        )
        
    except Exception as e:
        logger.error(f"Error in coach query: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process coach query: {str(e)}"
        )

# Generate embeddings endpoint
@app.post("/api/embeddings/generate", response_model=EmbeddingResponse)
async def generate_embeddings(
    request: EmbeddingRequest,
    user_id: str = Depends(get_current_user)
):
    """Generate embeddings for all user data"""
    try:
        if request.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only generate embeddings for your own data"
            )
        
        logger.info(f"Generating embeddings for user {user_id}")
        
        # Generate embeddings for user data
        embeddings_count = await generate_user_embeddings(user_id)
        
        return EmbeddingResponse(
            message="Embeddings generated successfully",
            embeddings_generated=embeddings_count
        )
        
    except Exception as e:
        logger.error(f"Error generating embeddings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate embeddings: {str(e)}"
        )

# Helper functions
async def get_user_context(user_id: str) -> Dict:
    """Get user profile and preferences"""
    try:
        # Get user profile - handle case where profile might not exist
        profile_result = supabase.table('profiles').select('*').eq('id', user_id).execute()
        profile = profile_result.data[0] if profile_result.data else {}
        
        # Get onboarding answers
        onboarding_result = supabase.table('onboarding_answers').select('*').eq('user_id', user_id).execute()
        onboarding = onboarding_result.data if onboarding_result.data else []
        
        # Debug: Log what we found
        logger.info(f"User ID being queried: {user_id}")
        logger.info(f"Profile found: {bool(profile)}")
        logger.info(f"Onboarding answers found: {len(onboarding) if onboarding else 0}")
        
        return {
            'profile': profile,
            'onboarding': onboarding
        }
    except Exception as e:
        logger.error(f"Error getting user context: {e}")
        return {'profile': {}, 'onboarding': []}

async def get_relevant_data(user_id: str, query: str) -> List[Dict]:
    """Get relevant data using vector similarity search"""
    try:
        # For now, return basic data - we'll implement vector search next
        goals_result = supabase.table('goals').select('*').eq('user_id', user_id).execute()
        tasks_result = supabase.table('tasks').select('*').eq('user_id', user_id).execute()
        journals_result = supabase.table('journal_entries').select('*').eq('user_id', user_id).execute()
        
        relevant_data = []
        
        # Debug: Check what user IDs exist in the tables
        all_goals = supabase.table('goals').select('user_id').execute()
        all_tasks = supabase.table('tasks').select('user_id').execute()
        
        if all_goals.data:
            unique_goal_users = list(set([goal['user_id'] for goal in all_goals.data]))
            logger.info(f"All user IDs with goals: {unique_goal_users}")
        if all_tasks.data:
            unique_task_users = list(set([task['user_id'] for task in all_tasks.data]))
            logger.info(f"All user IDs with tasks: {unique_task_users}")
        
        if goals_result.data:
            logger.info(f"Found {len(goals_result.data)} goals for user {user_id}")
            relevant_data.extend([{
                'type': 'goal',
                'content': f"{goal['title']} (Due: {goal.get('due_date', 'No due date')}, Progress: {goal.get('progress', 0)}%)",
                'metadata': {'due_date': goal.get('due_date'), 'progress': goal.get('progress'), 'timeframe': goal.get('timeframe')}
            } for goal in goals_result.data])
        else:
            logger.info(f"No goals found for user {user_id}")
        
        if tasks_result.data:
            logger.info(f"Found {len(tasks_result.data)} tasks for user {user_id}")
            relevant_data.extend([{
                'type': 'task',
                'content': f"{task['title']} (Status: {task.get('status', 'Unknown')}, High Impact: {task.get('is_high_impact', False)})",
                'metadata': {'status': task.get('status'), 'is_high_impact': task.get('is_high_impact'), 'is_completed': task.get('is_completed')}
            } for task in tasks_result.data])
        else:
            logger.info(f"No tasks found for user {user_id}")
        
        if journals_result.data:
            logger.info(f"Found {len(journals_result.data)} journal entries for user {user_id}")
            relevant_data.extend([{
                'type': 'journal',
                'content': journal.get('content', ''),
                'metadata': {'mood': journal.get('mood'), 'created_at': journal.get('created_at')}
            } for journal in journals_result.data])
        else:
            logger.info(f"No journal entries found for user {user_id}")
        
        logger.info(f"Total relevant data items: {len(relevant_data)}")
        return relevant_data[:10]  # Limit to 10 most recent items
        
    except Exception as e:
        logger.error(f"Error getting relevant data: {e}")
        return []

async def generate_coach_response(user_context: Dict, relevant_data: List[Dict], user_message: str, chat_history: Optional[List[Dict]] = None) -> str:
    """Generate personalized AI coach response"""
    try:
        # Build system prompt
        system_prompt = build_system_prompt(user_context, relevant_data)
        
        # Prepare conversation
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add chat history to messages if provided
        if chat_history:
            for turn in chat_history:
                messages.append({"role": "user", "content": turn["message"]})
                messages.append({"role": "assistant", "content": turn["response"]})
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        # Generate response using OpenAI (new syntax)
        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        logger.error(f"Error generating AI response: {e}")
        return "I'm having trouble processing your request right now. Please try again later."

def build_system_prompt(user_context: Dict, relevant_data: List[Dict]) -> str:
    """Build personalized system prompt for the AI coach"""
    profile = user_context.get('profile', {})
    onboarding = user_context.get('onboarding', [])
    
    # Format relevant data
    data_summary = ""
    for item in relevant_data:
        data_summary += f"- {item['type'].title()}: {item['content'][:100]}...\n"
    
    return f"""
    You are a personalized AI coach for {profile.get('display_name', profile.get('first_name', 'a user'))}.
    
    USER CONTEXT:
    - Vision: {profile.get('vision', 'Not set yet')}
    - Current Level: {profile.get('level', 1)}
    - XP: {profile.get('xp', 0)}
    - Onboarding Data: {onboarding}
    
    AVAILABLE USER DATA:
    {data_summary}
    
    COACHING STYLE:
    - Be motivational but realistic
    - Provide data-driven insights based on the user's ACTUAL goals and tasks
    - Give specific, actionable advice
    - Reference the user's vision and current progress
    - Be encouraging and supportive
    
    CRITICAL INSTRUCTIONS:
    - You MUST use the user's actual data from the AVAILABLE USER DATA section above
    - If they ask "What are my goals?", you MUST list their specific goals from the data
    - If they ask "What are my tasks?", you MUST list their specific tasks from the data
    - If they ask about progress, reference their specific progress numbers
    - NEVER give generic advice without referencing their real data
    - If no data exists for a category, say "I don't see any [goals/tasks] in your data yet"
    
    RESPONSE FORMAT:
    1. Acknowledge their question
    2. List their ACTUAL data (goals, tasks, etc.) from the available data above
    3. Provide specific insights based on their real data
    4. Suggest concrete next steps
    5. End with motivation
    
    Keep responses conversational, helpful, and under 200 words.
    """

async def generate_user_embeddings(user_id: str) -> int:
    """Generate embeddings for all user data (placeholder for now)"""
    # This will be implemented in the next step with pgvector
    logger.info(f"Placeholder: Would generate embeddings for user {user_id}")
    return 0

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
