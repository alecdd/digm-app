import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CheckCircle, Circle } from "lucide-react-native";
import colors from "@/constants/colors";
import { Task } from "@/types";

interface TaskCheckboxProps {
  task: Task;
  onToggle: () => void;
}

export default function TaskCheckbox({ task, onToggle }: TaskCheckboxProps) {
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        (task.isCompleted || task.status === "done") && styles.completedContainer
      ]}
      onPress={(task.isCompleted || task.status === "done") ? undefined : onToggle}
      testID={`task-checkbox-${task.id}`}
    >
      <View style={styles.checkbox}>
        {(task.isCompleted || task.status === "done") ? (
          <CheckCircle color={colors.success} size={24} />
        ) : (
          <Circle color={colors.primary} size={24} />
        )}
      </View>
      <View style={styles.content}>
        <Text style={[
          styles.title,
          (task.isCompleted || task.status === "done") && styles.titleCompleted
        ]}>
          {task.title}
        </Text>
        <View style={styles.badges}>
          {task.isHighImpact && (
            <Text style={styles.highImpactBadge}>🔥 High Impact</Text>
          )}
          <Text style={styles.xpBadge}>+{task.xpReward} XP</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.cardLight,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  completedContainer: {
    backgroundColor: colors.success + "10",
    borderColor: colors.success + "40",
  },
  checkbox: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
    marginBottom: 4,
  },
  titleCompleted: {
    textDecorationLine: "line-through",
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  highImpactBadge: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    backgroundColor: colors.primary + "15",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  xpBadge: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    backgroundColor: colors.primary + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});