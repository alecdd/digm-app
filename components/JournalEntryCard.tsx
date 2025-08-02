import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";
import { JournalEntry } from "@/types";

interface JournalEntryCardProps {
  entry: JournalEntry;
  onPress: () => void;
}

export default function JournalEntryCard({ entry, onPress }: JournalEntryCardProps) {
  // Format date to show day of week and date (e.g., "Monday, July 30")
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get a preview of the content (first 80 characters)
  const getContentPreview = (content: string) => {
    if (content.length <= 80) return content;
    return content.substring(0, 80) + "...";
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      testID={`journal-entry-${entry.id}`}
    >
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(entry.date)}</Text>
        <View style={styles.xpContainer}>
          <Text style={styles.xpText}>+{entry.xpEarned} XP</Text>
        </View>
      </View>
      <Text style={styles.preview}>{getContentPreview(entry.content)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  xpContainer: {
    backgroundColor: colors.xpColor,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  xpText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "bold",
  },
  preview: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});