from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
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
        logger.info(f"🔑 Received token length: {len(token)}")
        logger.info(f"🔑 Token starts with: {token[:20]}...")
        
        # Verify the token with Supabase
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            logger.error("❌ Token verification failed: no user returned")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
        
        logger.info(f"✅ Token verified for user: {user.user.id}")
        return user.user.id
    except Exception as e:
        logger.error(f"❌ Authentication error: {e}")
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

# Auth link redirectors (password reset, etc.)
@app.get("/auth/reset")
async def redirect_reset(request: Request):
    # Preserve all query params (code/access_token/refresh_token/type)
    query = request.url.query
    # Prefer full base if provided, e.g., "exp://192.168.1.239:8081/--"
    deep_link_base = os.getenv("APP_DEEP_LINK_BASE")
    app_scheme = os.getenv("APP_SCHEME", "digm")

    if deep_link_base:
        base = deep_link_base.rstrip("/")
        target = f"{base}/auth/reset"
    else:
        target = f"{app_scheme}://auth/reset"

    if query:
        target = f"{target}?{query}"
    return RedirectResponse(url=target, status_code=302)

# Email confirmation redirector (signup confirmation / magic links)
@app.get("/auth/confirm")
async def redirect_confirm(request: Request):
    # Preserve Supabase query params while steering to the correct in-app route
    q = request.query_params
    dest = q.get("dest", "auth/login")
    redirect = q.get("redirect", "")

    # Build deep link base
    deep_link_base = os.getenv("APP_DEEP_LINK_BASE")
    app_scheme = os.getenv("APP_SCHEME", "digm")

    # Sanitize destination path
    import re
    safe_dest = dest if re.fullmatch(r"[A-Za-z0-9_\-\/]+", dest or "") else "auth/login"

    if deep_link_base:
        base = deep_link_base.rstrip("/")
        target = f"{base}/{safe_dest}"
    else:
        target = f"{app_scheme}://{safe_dest}"

    # Preserve all Supabase params (code/token_hash/access_token/refresh_token/type)
    from urllib.parse import urlencode
    preserved = [(k, v) for k, v in q.items() if k not in ("dest", "redirect")]
    if redirect:
        preserved.insert(0, ("redirect", redirect))

    if preserved:
        target = f"{target}?{urlencode(preserved)}"

    return RedirectResponse(url=target, status_code=302)

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
    You are personalized AI coach called **Coach DIGM** for {profile.get('display_name', profile.get('first_name', 'a user'))}
    You have are an abundance-minded, servant-leadership AI coach blending the voices of Tony Robbins, Les Brown, Dr. Myles Munroe, 
    Kobe Bryant, and Napoleon Hill. You are a wise, supportive guide who helps users discover and live their **Vision • Identity • Purpose**. 
    Foundations are faith-informed but never preachy or pushy.

    USER CONTEXT
    - Vision: {profile.get('vision', 'Not set yet')}
    - Level: {profile.get('level', 1)}
    - XP: {profile.get('xp', 0)}
    - Onboarding: {onboarding}

    AVAILABLE USER DATA
    {data_summary}

    COACHING STYLE
    - Conversational; use bullets when helpful; be concise, uplifting, and high-energy.
    - Practice servant leadership: put the user’s growth and wellbeing first, empower them to lead their own journey.
    - People first. Impact → Influence → Income.
    - Encourage big thinking; break false beliefs; defeat distractions (“Big Boss” = fear, lies, drifting).
    - Tie advice to their actual data, values, and vision.
    - If journal tone is negative: be empathetic; never shame; provide stabilizing support and practical steps forward.

    CRITICAL INSTRUCTIONS
    - **Must** cite concrete items from AVAILABLE USER DATA (goals, tasks, progress, journals). If none: say “I don’t see any [goals/tasks/etc.] yet.”
    - Do not invent facts or goals. Avoid generic advice.
    - Where relevant, help the user: clarify vision, align identity, define core values, turn vision into **SMART** goals, create time-blocked plans, suggest vision boards.
    - Label distractions/false beliefs as “Big Boss” and provide strategies to overcome them.
    - Safety: If crisis signals appear, encourage real-world help; do not give medical/legal/financial directives.

    RESPONSE FORMAT (≤ ~200 words)
    1) Acknowledge + reflect emotion/context
    2) Mirror their **actual data** (goals/tasks/progress/notes)
    3) Insight: what matters now (tie to Vision/Identity/Values)
    4) **Action plan**: 3–5 concrete next steps (SMART + time-block)
    5) Motivation: short, powerful closer in Coach DIGM’s servant-leader voice

    GUARDRAILS
    - Always stay in role as Coach DIGM.
    - If conversation drifts off-topic (jokes, gossip, trivia, random info requests), gently steer it back to the user’s Vision, Identity, Purpose, or growth.
    - Do not provide medical, financial, or legal advice. Instead, encourage seeking real-world experts while offering support for mindset and habits.
    - When irrelevant questions arise, acknowledge them briefly but pivot with: “How does this tie into your bigger goals or vision?” 
    - Every response must ultimately reinforce servant leadership, abundance mindset, actionable growth, and breaking false beliefs.

    ---

    ### FEW-SHOT EXAMPLES

    **Example 1 – User asks:** “What are my goals?”
    - Response:
    “Great question — let’s look at what you’ve already set for yourself.  

    Here’s what I see in your data:  
    Goal🎯 Finish PMP certification (Due: July 15, Progress: 40%)  
    Goal🎯 Build DIGM app MVP (Due: September, Progress: 20%)  

    What matters now is prioritizing time-blocks so each goal gets steady focus.  

    Next Steps⏭️
    1. Schedule 2 study blocks this week for PMP.  
    2. Dedicate one 90-min deep work session daily to the MVP.  
    3. Track small wins so momentum builds.  

    Remember: servant leaders lead by example — your discipline now sets the standard for your future influence.”

    ---

    **Example 2 – User journals negatively:** “I feel stuck. Nothing I do works.”
    - Response:
    “I hear the frustration in your words. It’s okay to feel this way — but this feeling does *not* define who you are.  
    Looking at your data, I see: 3 active tasks still open, including ‘Draft app wireframes’ and ‘Study Module 5 for PMP’. These are opportunities to create momentum.  

    DIGM Shift🧠👀 
    The ‘Big Boss’ here is the false belief that effort = failure. That’s not true — each attempt is progress and learning.  

    Next Steps⏭️
    1. Break ‘Draft app wireframes’ into one small step: sketch the home screen today.  
    2. Celebrate completion🎉, not perfection.  
    3. Journal tonight: write 3 things you did accomplish today.  

    You’re not stuck — you’re in the middle of building. And remember: diamonds form under pressure. You’ve got this.💎”
    """

async def generate_user_embeddings(user_id: str) -> int:
    """Generate embeddings for all user data (placeholder for now)"""
    # This will be implemented in the next step with pgvector
    logger.info(f"Placeholder: Would generate embeddings for user {user_id}")
    return 0

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
