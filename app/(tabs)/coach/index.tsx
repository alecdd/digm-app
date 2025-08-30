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
import { Send, Brain, RefreshCw } from "@/lib/icons";
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
  const { completedGoal, clearCompletedGoal, userId } = useDigmStore();
  const { queryCoach, generateEmbeddings, loading: aiLoading, error: aiError } = useAICoach();

  const [inputText, setInputText] = useState("");
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
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

  const handleGenerateEmbeddings = useCallback(async () => {
    if (!userId) {
      Alert.alert("Error", "User ID not found");
      return;
    }

    setIsGeneratingEmbeddings(true);
    try {
      const result = await generateEmbeddings(userId);
      if (result) {
        Alert.alert(
          "Success", 
          `Generated ${result.embeddings_generated} embeddings for your data. This will improve AI responses!`
        );
      }
    } catch (error) {
      console.error("Failed to generate embeddings:", error);
      Alert.alert("Error", "Failed to generate embeddings. Please try again.");
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  }, [userId, generateEmbeddings]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      const t = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [messages]);

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
      {/* AI Coach Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Brain color={colors.primary} size={24} />
          <Text style={styles.headerTitle}>AI Coach</Text>
        </View>
        <TouchableOpacity
          style={[styles.embeddingButton, isGeneratingEmbeddings && styles.embeddingButtonDisabled]}
          onPress={handleGenerateEmbeddings}
          disabled={isGeneratingEmbeddings}
        >
          <RefreshCw 
            color={colors.text} 
            size={16} 
            style={isGeneratingEmbeddings ? styles.rotating : undefined}
          />
          <Text style={styles.embeddingButtonText}>
            {isGeneratingEmbeddings ? "Generating..." : "Update AI"}
          </Text>
        </TouchableOpacity>
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
          paddingBottom: isKeyboardOpen && isInputFocused ? 120 : 12
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

      {(isLoading || aiLoading) && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {aiLoading ? "AI Coach is thinking..." : "Coach is typing..."}
          </Text>
        </View>
      )}

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 8,
  },
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
    borderWidth: 1,
    borderColor: colors.border,
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
  loadingContainer: {
    position: "absolute",
    bottom: 70,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingVertical: 4,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
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
