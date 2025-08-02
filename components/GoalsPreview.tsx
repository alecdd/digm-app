import React from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "@/constants/colors";
import GoalCard from "./GoalCard";
import { Goal } from "@/types";

interface GoalsPreviewProps {
  goals: Goal[];
}

export default function GoalsPreview({ goals }: GoalsPreviewProps) {
  return (
    <View style={styles.container} testID="goals-preview">
      <Text style={styles.title}>Your Goals</Text>
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
  },
});