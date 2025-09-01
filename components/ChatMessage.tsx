import React from "react";
import { StyleSheet, Text, View } from "react-native";
import DigmLogo from "@/components/DigmLogo";
import colors from "@/constants/colors";

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  timestamp: string;
}

export default function ChatMessage({ content, isUser, timestamp }: ChatMessageProps) {
  // Format timestamp to show only time (HH:MM AM/PM)
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isTypingPlaceholder = content === "__typing__" && !isUser;

  return (
    <View 
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.coachContainer
      ]}
      testID={`chat-message-${isUser ? 'user' : 'coach'}`}
    >
      {isTypingPlaceholder ? (
        <View style={[styles.bubble, styles.coachBubble, styles.typingBubble]}>
          <DigmLogo size={32} style={{ marginRight: 12 }} />
          <View style={styles.dotsRow}>
            <View style={styles.dot} />
            <View style={[styles.dot, { opacity: 0.7 }]} />
            <View style={[styles.dot, { opacity: 0.5 }]} />
          </View>
        </View>
      ) : (
        <>
          <View 
            style={[
              styles.bubble,
              isUser ? styles.userBubble : styles.coachBubble
            ]}
          >
            <Text style={styles.messageText}>{content}</Text>
          </View>
          <Text style={styles.timestamp}>{formatTime(timestamp)}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    maxWidth: "80%",
  },
  userContainer: {
    alignSelf: "flex-end",
  },
  coachContainer: {
    alignSelf: "flex-start",
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: colors.primary,
  },
  coachBubble: {
    backgroundColor: colors.card,
  },
  typingBubble: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.textSecondary },
  messageText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    alignSelf: "flex-end",
  },
});