import React, { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useDigmStore } from "@/hooks/useDigmStore";
import QuoteCard from "@/components/QuoteCard";
import VisionSnapshot from "@/components/VisionSnapshot";
import FocusGoals from "@/components/FocusGoals";
import HighImpactTasks from "@/components/HighImpactTasks";
import WorkflowSection from "@/components/WorkflowSection";
import { Task } from "@/types";
import colors from "@/constants/colors";

export default function HomeScreen() {
  const { userProfile, quote, tasksByStatus, updateTask, highImpactTasks } = useDigmStore();

  const handleToggleTask = useCallback((task: Task) => {
    const updatedTask = {
      ...task,
      isCompleted: !task.isCompleted,
      status: task.isCompleted ? task.status : "done",
      completedAt: task.isCompleted ? undefined : new Date().toISOString(),
    };
    updateTask(updatedTask);
  }, [updateTask]);

  const handleMoveTask = useCallback((taskId: string, newStatus: "open" | "inProgress" | "done") => {
    const task = Object.values(tasksByStatus).flat().find(t => t.id === taskId);
    if (task) {
      const updatedTask = {
        ...task,
        status: newStatus,
        isCompleted: newStatus === "done",
        completedAt: newStatus === "done" ? new Date().toISOString() : undefined,
      };
      updateTask(updatedTask);
    }
  }, [tasksByStatus, updateTask]);

  return (
    <ScrollView style={styles.container} testID="home-screen">
      <View style={styles.content}>
        <QuoteCard quote={quote.quote} author={quote.author} />
        <VisionSnapshot vision={userProfile.vision} />
        <FocusGoals />
        <HighImpactTasks 
          tasks={highImpactTasks} 
          onToggleTask={handleToggleTask} 
        />
        <WorkflowSection 
          tasks={tasksByStatus} 
          onMoveTask={handleMoveTask} 
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
});