import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface CoachQuery {
  message: string;
  chat_history?: Array<{message: string, response: string, timestamp: string}>;
}

interface CoachResponse {
  response: string;
  relevant_data: Array<{
    type: string;
    content: string;
    metadata: Record<string, any>;
    relevance_score?: number;
  }>;
  user_context: {
    profile: Record<string, any>;
    onboarding: Array<any>;
  };
}

interface EmbeddingRequest {
  user_id: string;
}

interface EmbeddingResponse {
  message: string;
  embeddings_generated: number;
}

export function useAICoach() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Resolve backend URL from env; fall back to local during dev
  const getBackendUrl = () => {
    const envUrl =
      process.env.EXPO_PUBLIC_COACH_API_BASE ||
      process.env.EXPO_PUBLIC_RORK_API_BASE_URL ||
      '';

    if (envUrl) return envUrl.replace(/\/$/, '');

    // Fallback for local development when env is not set
    if (__DEV__) return 'http://192.168.1.239:8000';

    throw new Error('Coach API base URL is not configured');
  };

  const queryCoach = useCallback(async (message: string, chatHistory?: Array<{message: string, response: string, timestamp: string}>): Promise<CoachResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No active session found');
      }

      const backendUrl = getBackendUrl();
      console.log('🔗 Coach API URL:', `${backendUrl}/api/coach/query`);
      console.log('🔑 Token length:', session.access_token.length);
      
      const response = await fetch(`${backendUrl}/api/coach/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message,
          chat_history: chatHistory
        } as CoachQuery),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: CoachResponse = await response.json();
      return data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('AI Coach query error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateEmbeddings = useCallback(async (userId: string): Promise<EmbeddingResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No active session found');
      }

      const backendUrl = getBackendUrl();
      console.log('🔗 Embeddings API URL:', `${backendUrl}/api/embeddings/generate`);
      console.log('🔑 Token length:', session.access_token.length);
      
      const response = await fetch(`${backendUrl}/api/embeddings/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id: userId } as EmbeddingRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: EmbeddingResponse = await response.json();
      return data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Embedding generation error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    queryCoach,
    generateEmbeddings,
    loading,
    error,
    clearError,
  };
}
