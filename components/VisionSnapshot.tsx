import React from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "@/constants/colors";

interface VisionSnapshotProps {
  vision: string;
}

export default function VisionSnapshot({ vision }: VisionSnapshotProps) {
  return (
    <View style={styles.container} testID="vision-snapshot">
      <Text style={styles.title}>Vision Snapshot</Text>
      <Text style={styles.visionText}>{vision}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: 20,
    backgroundColor: colors.card,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 8,
  },
  visionText: {
    fontSize: 18,
    color: colors.text,
    lineHeight: 26,
  },
});