// app/(tabs)/coach/index.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  SafeAreaView,
  Keyboard,
} from "react-native";
import DigmLogo from "@/components/DigmLogo";
import { Send, Brain } from "@/lib/icons";
import { useFocusEffect } from "@react-navigation/native";
import colors from "@/constants/colors";
import { useCoachStore } from "@/hooks/useCoachStore";
import { useDigmStore } from "@/hooks/useDigmStore";
import { useAICoach } from "@/hooks/useAICoach";
import ChatMessage from "@/components/ChatMessage";
import SuggestionChip from "@/components/SuggestionChip";
import GoalCompletionEffect from "@/components/GoalCompletionEffect";

export default function CoachScreen() {
  // Get the store once, then use its fields
  const store = useCoachStore();
  const { completedGoal, clearCompletedGoal, userId, goals, tasks, journalEntries } = useDigmStore();
  const { queryCoach, generateEmbeddings, loading: aiLoading, error: aiError } = useAICoach();

  const [inputText, setInputText] = useState("");
  // Auto-reindex throttling refs
  const lastIndexedAtRef = useRef<number>(0);
  const lastCountsRef = useRef<{ g: number; t: number; j: number } | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // If provider isn't mounted for some reason, show nothing (or a fallback)
  if (!store) return null;

  const { messages, isLoading, sendMessage, getSuggestions, loadMessages } = store;

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Handle AI errors
  useEffect(() => {
    if (aiError) {
      Alert.alert("AI Coach Error", aiError, [{ text: "OK" }]);
    }
  }, [aiError]);

  const handleSend = useCallback(async () => {
    if (inputText.trim() && !isLoading && !aiLoading) {
      const userMessage = inputText.trim();
      setInputText("");
      
      // Add user message to chat
      sendMessage(userMessage, "user");
      
      // Prepare chat history for AI context
      const chatHistory = messages.slice(-10).map(msg => ({
        message: msg.sender === "user" ? msg.content : "",
        response: msg.sender === "coach" ? msg.content : "",
        timestamp: msg.timestamp
      })).filter(item => item.message || item.response);
      
      // Get AI response
      try {
        const aiResponse = await queryCoach(userMessage, chatHistory);
        if (aiResponse) {
          // Add AI response to chat
          sendMessage(aiResponse.response, "coach");
        }
      } catch (error) {
        console.error("Failed to get AI response:", error);
        // Fallback to regular coach response
        sendMessage("I'm having trouble processing your request right now. Let me help you with some general guidance.", "coach");
      }
    }
  }, [inputText, isLoading, aiLoading, sendMessage, queryCoach, messages]);

  const handleSuggestionPress = useCallback((suggestion: string) => {
    setInputText(suggestion);
  }, []);

  // Auto re-index embeddings when data meaningfully changes (throttled)
  useEffect(() => {
    if (!userId) return;
    const now = Date.now();
    const throttleMs = 10 * 60 * 1000; // 10 minutes
    const counts = { g: goals?.length ?? 0, t: tasks?.length ?? 0, j: journalEntries?.length ?? 0 };
    const countsChanged = JSON.stringify(counts) !== JSON.stringify(lastCountsRef.current);
    const throttled = now - lastIndexedAtRef.current < throttleMs;
    if (!countsChanged || throttled) return;
    lastCountsRef.current = counts;
    lastIndexedAtRef.current = now;
    (async () => {
      try { await generateEmbeddings(userId); } catch (e) { console.log("auto-reindex failed", e); }
    })();
  }, [userId, goals?.length, tasks?.length, journalEntries?.length, generateEmbeddings]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      const t = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [messages]);

  // Ensure we scroll to bottom whenever the Coach tab gains focus
  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(t);
    }, [messages.length])
  );

  // Handle keyboard events for dynamic input sizing
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardOpen(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardOpen(false);
      setIsInputFocused(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Handle scroll events to show/hide scroll to bottom button
  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    
    // Show button if user has scrolled up (not at bottom)
    const isAtBottom = offsetY + layoutHeight >= contentHeight - 20;
    setShowScrollToBottom(!isAtBottom);
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
      setShowScrollToBottom(false);
    }
  };



  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Compact centered header */}
      <View style={styles.controlRow}>
        <Brain color={colors.primary} size={18} />
        <Text style={styles.controlTitle}>Coach DIGM</Text>
      </View>

      <FlatList
        ref={flatListRef}
        style={styles.messageList}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatMessage
            content={item.content}
            isUser={item.sender === "user"}
            timestamp={item.timestamp}
          />
        )}
        contentContainerStyle={styles.messageListContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListFooterComponent={(isLoading || aiLoading) ? (
          <ChatMessage content="__typing__" isUser={false} timestamp={new Date().toISOString()} />
        ) : null}
      />

      {/* Floating Scroll to Bottom Button */}
      {showScrollToBottom && (
        <TouchableOpacity
          style={styles.scrollToBottomButton}
          onPress={scrollToBottom}
          activeOpacity={0.7}
        >
          <View style={styles.scrollToBottomIcon}>
            <Text style={styles.scrollToBottomText}>↓</Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={[styles.suggestionsContainer, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.suggestionsScroll, { backgroundColor: 'rgba(0,0,0,0.1)' }]}
        >
          {getSuggestions().map((suggestion, idx) => (
            <SuggestionChip
              key={`${suggestion}-${idx}`}
              text={suggestion}
              onPress={() => handleSuggestionPress(suggestion)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={[
        styles.inputContainer,
        { 
          paddingBottom: isKeyboardOpen && isInputFocused ? 65 : 12
        }
      ]}>
        <TextInput
          style={[
            styles.input,
            { 
              height: isKeyboardOpen && isInputFocused 
                ? Math.max(50, Math.min(50, inputText.split('\n').length * 18 + 60))
                : 50
            }
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask your AI coach anything..."
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          editable={!isLoading && !aiLoading}
          textAlignVertical="top"
          autoCorrect={false}
          autoCapitalize="sentences"
          blurOnSubmit={false}
          enablesReturnKeyAutomatically={true}
          scrollEnabled={true}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isLoading || aiLoading) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading || aiLoading}
        >
          <Send color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      {/* (typing indicator rendered by FlatList footer; remove duplicates) */}

      {/* Goal Completion Effect */}
      {completedGoal && (
        <GoalCompletionEffect
          visible={!!completedGoal}
          goalTitle={completedGoal.title}
          onAnimationEnd={clearCompletedGoal}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  controlTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginLeft: 6 },
  embeddingButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  embeddingButtonDisabled: {
    backgroundColor: colors.inactive,
  },
  embeddingButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  rotating: {
    transform: [{ rotate: "360deg" }],
  },
  messageList: { flex: 1 },
  messageListContent: { padding: 16 },
  suggestionsContainer: { 
    paddingHorizontal: 16, 
    marginBottom: 8, 
    backgroundColor: 'rgba(0,0,0,0.1)',
    position: 'relative',
    zIndex: 1
  },
  suggestionsScroll: { 
    paddingVertical: 8, 
    backgroundColor: 'rgba(0,0,0,0.1)' 
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    minHeight: 60,
  },
  input: {
    flex: 1,
    backgroundColor: colors.cardLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    fontSize: 16,
    lineHeight: 20,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: { backgroundColor: colors.inactive },
  footerTypingBubble: { alignSelf: 'flex-start', marginLeft: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  dotsRow: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textSecondary },
  scrollToBottomButton: {
    position: 'absolute',
    right: 20,
    bottom: 150,
    zIndex: 1000,
  },
  scrollToBottomIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollToBottomText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
