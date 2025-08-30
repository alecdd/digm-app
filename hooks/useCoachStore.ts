import createContextHook from "@nkzw/create-context-hook";
import { useState, useCallback, useEffect } from "react";
import { mockCoachMessages, coachSuggestions } from "@/mocks/data";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Message {
  id: string;
  sender: "user" | "coach";
  content: string;
  timestamp: string;
}

export const [CoachProvider, useCoachStore] = createContextHook(() => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Initialize messages from mock data
  useEffect(() => {
    // Convert mock data to match Message type
    const typedMessages: Message[] = mockCoachMessages.map(msg => ({
      ...msg,
      sender: msg.sender as "user" | "coach"
    }));
    setMessages(typedMessages);
  }, []);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load messages from storage
  const loadMessages = useCallback(async () => {
    try {
      const storedMessages = await AsyncStorage.getItem("coach_messages");
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    } catch (error) {
      console.error("Error loading coach messages:", error);
    }
  }, []);

  // Save messages to storage
  const saveMessages = useCallback(async (updatedMessages: Message[]) => {
    try {
      await AsyncStorage.setItem("coach_messages", JSON.stringify(updatedMessages));
    } catch (error) {
      console.error("Error saving coach messages:", error);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (content: string, sender: "user" | "coach" = "user") => {
    if (!content.trim()) return;

    const newMessage: Message = {
      id: `msg${Date.now()}`,
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
    
    // No more hardcoded AI responses - they come from the actual AI API
    if (sender === "user") {
      setIsLoading(false); // Don't set loading here, let the component handle it
    }
  }, [saveMessages]);

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