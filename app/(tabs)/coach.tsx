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
  View 
} from "react-native";
import { Send } from "lucide-react-native";
import { Stack } from "expo-router";
import colors from "@/constants/colors";
import { useCoachStore } from "@/hooks/useCoachStore";
import ChatMessage from "@/components/ChatMessage";
import SuggestionChip from "@/components/SuggestionChip";

export default function CoachScreen() {
  const { messages, isLoading, sendMessage, getSuggestions, loadMessages } = useCoachStore();
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSend = useCallback(() => {
    if (inputText.trim() && !isLoading) {
      sendMessage(inputText);
      setInputText("");
    }
  }, [inputText, isLoading, sendMessage]);

  const handleSuggestionPress = useCallback((suggestion: string) => {
    setInputText(suggestion);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Stack.Screen options={{ title: "👤 Coach DIGM" }} />
      
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
      />
      
      <View style={styles.suggestionsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsScroll}
        >
          {getSuggestions().map((suggestion, index) => (
            <SuggestionChip
              key={index}
              text={suggestion}
              onPress={() => handleSuggestionPress(suggestion)}
            />
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!inputText.trim() || isLoading) && styles.sendButtonDisabled
          ]} 
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Send color={colors.text} size={20} />
        </TouchableOpacity>
      </View>
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Coach is typing...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  suggestionsScroll: {
    paddingVertical: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    backgroundColor: colors.cardLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    maxHeight: 100,
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
  sendButtonDisabled: {
    backgroundColor: colors.inactive,
  },
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
});