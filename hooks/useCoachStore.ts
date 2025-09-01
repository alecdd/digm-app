import createContextHook from "@nkzw/create-context-hook";
import { useState, useCallback, useEffect, useMemo } from "react";
import { mockCoachMessages, coachSuggestions } from "@/mocks/data";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDigmStore } from "@/hooks/useDigmStore";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  sender: "user" | "coach";
  content: string;
  timestamp: string;
}

export const [CoachProvider, useCoachStore] = createContextHook(() => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { userId } = useDigmStore();
  const storageKey = useMemo(() => `coach_messages_${userId ?? "guest"}`, [userId]);
  const [threadId, setThreadId] = useState<string | null>(null);
  
  // Ensure there is a thread for this user and return its id
  const ensureThread = useCallback(async (): Promise<string | null> => {
    if (!userId) return null;
    if (threadId) return threadId;
    try {
      const { data: existing } = await supabase
        .from("coach_threads")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing?.id) {
        setThreadId(existing.id);
        return existing.id;
      }
      const { data: created, error } = await supabase
        .from("coach_threads")
        .insert({ user_id: userId })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      setThreadId(created!.id);
      return created!.id;
    } catch (e) {
      console.error("ensureThread failed:", e);
      return null;
    }
  }, [userId, threadId]);
  
  // Load messages for the current user (prefer server, fallback to cache/defaults)
  useEffect(() => {
    (async () => {
      try {
        const tid = await ensureThread();
        if (tid) {
          const { data, error } = await supabase
            .from("coach_messages")
            .select("id, role, content, created_at")
            .eq("thread_id", tid)
            .order("created_at", { ascending: false })
            .limit(50);
          if (!error && data) {
            const loaded: Message[] = data
              .slice()
              .reverse()
              .map((r: any) => ({ id: r.id, sender: (r.role as string) === "user" ? "user" : "coach", content: r.content, timestamp: r.created_at }));
            setMessages(loaded);
            await AsyncStorage.setItem(storageKey, JSON.stringify(loaded));
            return;
          }
        }
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          setMessages(JSON.parse(stored));
          return;
        }
        const typedDefaults: Message[] = mockCoachMessages.map((m) => ({
          ...m,
          sender: m.sender as "user" | "coach",
        }));
        setMessages(typedDefaults);
        await AsyncStorage.setItem(storageKey, JSON.stringify(typedDefaults));
      } catch (e) {
        console.error("Error initializing coach messages:", e);
      }
    })();
  }, [storageKey, ensureThread]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load messages from storage
  const loadMessages = useCallback(async () => {
    try {
      const tid = await ensureThread();
      if (tid) {
        const { data, error } = await supabase
          .from("coach_messages")
          .select("id, role, content, created_at")
          .eq("thread_id", tid)
          .order("created_at", { ascending: false })
          .limit(50);
        if (!error && data) {
          const loaded: Message[] = data
            .slice()
            .reverse()
            .map((r: any) => ({ id: r.id, sender: (r.role as string) === "user" ? "user" : "coach", content: r.content, timestamp: r.created_at }));
          setMessages(loaded);
          await AsyncStorage.setItem(storageKey, JSON.stringify(loaded));
          return;
        }
      }
      const storedMessages = await AsyncStorage.getItem(storageKey);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    } catch (error) {
      console.error("Error loading coach messages:", error);
    }
  }, [storageKey, ensureThread]);

  // Save messages to storage
  const saveMessages = useCallback(async (updatedMessages: Message[]) => {
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedMessages));
    } catch (error) {
      console.error("Error saving coach messages:", error);
    }
  }, [storageKey]);

  // Send a message
  const sendMessage = useCallback(async (content: string, sender: "user" | "coach" = "user") => {
    if (!content.trim()) return;

    const newMessage: Message = {
      id: `local-${Date.now()}`,
      sender,
      content,
      timestamp: new Date().toISOString(),
    };

    console.log(`[CoachStore] Adding message:`, { sender, content: content.substring(0, 50) });

    // Use functional state update to ensure we have the latest messages
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, newMessage];
      console.log(`[CoachStore] Updated messages count:`, updatedMessages.length);
      
      // Save to storage asynchronously
      saveMessages(updatedMessages);
      
      return updatedMessages;
    });
    
    // best-effort persist to Supabase
    try {
      const tid = await ensureThread();
      if (tid && userId) {
        await supabase.from("coach_messages").insert({
          thread_id: tid,
          user_id: userId,
          role: sender === "user" ? "user" : "assistant",
          content,
        });
      }
    } catch (e) {
      console.error("Failed to persist coach message:", e);
    }
  }, [saveMessages, ensureThread, userId]);

  // Get coach suggestions
  const getSuggestions = useCallback(() => {
    return coachSuggestions;
  }, []);

  // Helper function to generate coach responses
  const getCoachResponse = (userMessage: string): string => {
    const lowerCaseMessage = userMessage.toLowerCase();
    
    if (lowerCaseMessage.includes("focus") || lowerCaseMessage.includes("concentrate")) {
      return "To improve focus, try the Pomodoro Technique: work for 25 minutes, then take a 5-minute break. Also, eliminate distractions by putting your phone in another room and using website blockers if needed.";
    } else if (lowerCaseMessage.includes("procrastination") || lowerCaseMessage.includes("procrastinate")) {
      return "Procrastination often comes from feeling overwhelmed. Break your task into smaller, more manageable steps. Start with just 5 minutes of work - often, getting started is the hardest part.";
    } else if (lowerCaseMessage.includes("goal") || lowerCaseMessage.includes("progress")) {
      return "For consistent goal progress, try the 1% rule - aim to improve by just 1% each day. Review your goals weekly and adjust your approach based on what's working and what isn't.";
    } else if (lowerCaseMessage.includes("motivation") || lowerCaseMessage.includes("inspired")) {
      return "Motivation follows action, not the other way around. Start with a small step, and the motivation will come. Also, connect with your 'why' - remind yourself of the deeper reason behind your goals.";
    } else {
      return "I'm here to support your growth journey. Would you like tips on focus, overcoming procrastination, making progress on goals, or finding motivation?";
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    getSuggestions,
    loadMessages,
  };
});