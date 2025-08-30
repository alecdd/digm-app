import openai
from supabase import Client
from typing import List, Dict, Optional
import numpy as np
import logging
import json

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self, supabase_client: Client, openai_client):
        self.supabase = supabase_client
        self.openai = openai_client
        
    async def generate_user_embeddings(self, user_id: str) -> int:
        """Generate embeddings for all user data"""
        try:
            logger.info(f"Generating embeddings for user {user_id}")
            
            # Fetch all user data
            goals = await self._fetch_user_goals(user_id)
            tasks = await self._fetch_user_tasks(user_id)
            journals = await self._fetch_user_journals(user_id)
            profile = await self._fetch_user_profile(user_id)
            
            embeddings_created = 0
            
            # Generate embeddings for goals
            for goal in goals:
                await self._create_goal_embedding(user_id, goal)
                embeddings_created += 1
            
            # Generate embeddings for tasks
            for task in tasks:
                await self._create_task_embedding(user_id, task)
                embeddings_created += 1
            
            # Generate embeddings for journal entries
            for journal in journals:
                await self._create_journal_embedding(user_id, journal)
                embeddings_created += 1
            
            # Generate embedding for profile/vision
            if profile and profile.get('vision'):
                await self._create_profile_embedding(user_id, profile)
                embeddings_created += 1
            
            logger.info(f"Generated {embeddings_created} embeddings for user {user_id}")
            return embeddings_created
            
        except Exception as e:
            logger.error(f"Error generating embeddings for user {user_id}: {e}")
            raise
    
    async def search_relevant_data(self, user_id: str, query: str, limit: int = 10) -> List[Dict]:
        """Search for relevant data using vector similarity"""
        try:
            # Generate embedding for the query
            query_embedding = await self._generate_text_embedding(query)
            
            # Search for similar embeddings
            # Note: This will be implemented with pgvector in the next step
            # For now, return basic search results
            return await self._basic_search(user_id, query, limit)
            
        except Exception as e:
            logger.error(f"Error searching relevant data: {e}")
            return []
    
    async def _fetch_user_goals(self, user_id: str) -> List[Dict]:
        """Fetch user goals from Supabase"""
        try:
            result = self.supabase.table('goals').select('*').eq('user_id', user_id).execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error fetching goals: {e}")
            return []
    
    async def _fetch_user_tasks(self, user_id: str) -> List[Dict]:
        """Fetch user tasks from Supabase"""
        try:
            result = self.supabase.table('tasks').select('*').eq('user_id', user_id).execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error fetching tasks: {e}")
            return []
    
    async def _fetch_user_journals(self, user_id: str) -> List[Dict]:
        """Fetch user journal entries from Supabase"""
        try:
            result = self.supabase.table('journal_entries').select('*').eq('user_id', user_id).execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error fetching journal entries: {e}")
            return []
    
    async def _fetch_user_profile(self, user_id: str) -> Optional[Dict]:
        """Fetch user profile from Supabase"""
        try:
            result = self.supabase.table('profiles').select('*').eq('id', user_id).single().execute()
            return result.data if result.data else None
        except Exception as e:
            logger.error(f"Error fetching profile: {e}")
            return None
    
    async def _generate_text_embedding(self, text: str) -> List[float]:
        """Generate OpenAI embedding for text"""
        try:
            response = self.openai.Embedding.create(
                model="text-embedding-3-small",
                input=text
            )
            return response['data'][0]['embedding']
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise
    
    async def _create_goal_embedding(self, user_id: str, goal: Dict):
        """Create embedding for a goal"""
        try:
            text = f"{goal.get('title', '')} {goal.get('description', '')}"
            embedding = await self._generate_text_embedding(text)
            
            # Store in user_embeddings table (will be created in Supabase)
            embedding_data = {
                'user_id': user_id,
                'content_type': 'goal',
                'content_id': goal['id'],
                'content_text': text,
                'embedding': embedding,
                'metadata': {
                    'status': goal.get('status'),
                    'timeframe': goal.get('timeframe'),
                    'priority': goal.get('priority')
                }
            }
            
            # For now, just log - we'll implement storage when we set up pgvector
            logger.info(f"Would store goal embedding: {goal.get('title', 'Unknown Goal')}")
            
        except Exception as e:
            logger.error(f"Error creating goal embedding: {e}")
    
    async def _create_task_embedding(self, user_id: str, task: Dict):
        """Create embedding for a task"""
        try:
            text = f"{task.get('title', '')} {task.get('description', '')}"
            embedding = await self._generate_text_embedding(text)
            
            embedding_data = {
                'user_id': user_id,
                'content_type': 'task',
                'content_id': task['id'],
                'content_text': text,
                'embedding': embedding,
                'metadata': {
                    'status': task.get('status'),
                    'priority': task.get('priority'),
                    'goal_id': task.get('goal_id')
                }
            }
            
            logger.info(f"Would store task embedding: {task.get('title', 'Unknown Task')}")
            
        except Exception as e:
            logger.error(f"Error creating task embedding: {e}")
    
    async def _create_journal_embedding(self, user_id: str, journal: Dict):
        """Create embedding for a journal entry"""
        try:
            text = journal.get('content', '')
            if not text:
                return
                
            embedding = await self._generate_text_embedding(text)
            
            embedding_data = {
                'user_id': user_id,
                'content_type': 'journal',
                'content_id': journal['id'],
                'content_text': text,
                'embedding': embedding,
                'metadata': {
                    'mood': journal.get('mood'),
                    'created_at': journal.get('created_at')
                }
            }
            
            logger.info(f"Would store journal embedding: {text[:50]}...")
            
        except Exception as e:
            logger.error(f"Error creating journal embedding: {e}")
    
    async def _create_profile_embedding(self, user_id: str, profile: Dict):
        """Create embedding for user profile/vision"""
        try:
            text = profile.get('vision', '')
            if not text:
                return
                
            embedding = await self._generate_text_embedding(text)
            
            embedding_data = {
                'user_id': user_id,
                'content_type': 'profile',
                'content_id': profile['id'],
                'content_text': text,
                'embedding': embedding,
                'metadata': {
                    'level': profile.get('level'),
                    'xp': profile.get('xp')
                }
            }
            
            logger.info(f"Would store profile embedding: {text[:50]}...")
            
        except Exception as e:
            logger.error(f"Error creating profile embedding: {e}")
    
    async def _basic_search(self, user_id: str, query: str, limit: int) -> List[Dict]:
        """Basic search without vector similarity (fallback)"""
        try:
            # Simple text-based search for now
            goals = await self._fetch_user_goals(user_id)
            tasks = await self._fetch_user_tasks(user_id)
            journals = await self._fetch_user_journals(user_id)
            
            relevant_data = []
            
            # Search in goals
            for goal in goals:
                if query.lower() in goal.get('title', '').lower() or query.lower() in goal.get('description', '').lower():
                    relevant_data.append({
                        'type': 'goal',
                        'content': f"{goal['title']}: {goal['description']}",
                        'metadata': {'status': goal.get('status'), 'timeframe': goal.get('timeframe')},
                        'relevance_score': 0.8
                    })
            
            # Search in tasks
            for task in tasks:
                if query.lower() in task.get('title', '').lower() or query.lower() in task.get('description', '').lower():
                    relevant_data.append({
                        'type': 'task',
                        'content': f"{task['title']}: {task['description']}",
                        'metadata': {'status': task.get('status'), 'priority': task.get('priority')},
                        'relevance_score': 0.7
                    })
            
            # Search in journal entries
            for journal in journals:
                if query.lower() in journal.get('content', '').lower():
                    relevant_data.append({
                        'type': 'journal',
                        'content': journal.get('content', ''),
                        'metadata': {'mood': journal.get('mood'), 'created_at': journal.get('created_at')},
                        'relevance_score': 0.6
                    })
            
            # Sort by relevance and limit results
            relevant_data.sort(key=lambda x: x['relevance_score'], reverse=True)
            return relevant_data[:limit]
            
        except Exception as e:
            logger.error(f"Error in basic search: {e}")
            return []
