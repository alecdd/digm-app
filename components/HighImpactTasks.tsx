import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Flame } from "lucide-react-native";
import colors from "@/constants/colors";
import TaskCheckbox from "./TaskCheckbox";
import { Task } from "@/types";

interface HighImpactTasksProps {
  tasks: Task[];
  onToggleTask: (task: Task) => void;
}

export default function HighImpactTasks({ tasks, onToggleTask }: HighImpactTasksProps) {
  return (
    <View style={styles.container} testID="high-impact-tasks">
      <View style={styles.titleContainer}>
        <Flame color={colors.primary} size={24} />
        <Text style={styles.title}>Your 20% Today</Text>
      </View>
      
      {tasks.length > 0 ? (
        tasks.map((task) => (
          <TaskCheckbox
            key={task.id}
            task={task}
            onToggle={() => onToggleTask(task)}
          />
        ))
      ) : (
        <Text style={styles.emptyText}>No high-impact tasks for today</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "rgba(0, 102, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginLeft: 8,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
  },
});