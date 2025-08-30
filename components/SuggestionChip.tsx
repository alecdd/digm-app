import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import colors from "@/constants/colors";

interface SuggestionChipProps {
  text: string;
  onPress: () => void;
}

export default function SuggestionChip({ text, onPress }: SuggestionChipProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      testID={`suggestion-chip-${text}`}
    >
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    color: colors.text,
    fontSize: 14,
  },
});