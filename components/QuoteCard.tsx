import React from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "@/constants/colors";

interface QuoteCardProps {
  quote: string;
  author: string;
}

export default function QuoteCard({ quote, author }: QuoteCardProps) {
  return (
    <View style={styles.container} testID="quote-card">
      <Text style={styles.quoteText}>
        Quote of the Day: &quot;{quote}&quot;
      </Text>
      <Text style={styles.authorText}>- {author}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.quoteBg,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  quoteText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  authorText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});