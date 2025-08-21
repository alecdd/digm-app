import React, { useCallback, useEffect } from "react";
import { ScrollView, StyleSheet, View, ActivityIndicator } from "react-native";
import { useDigmStore } from "@/hooks/useDigmStore";
import QuoteCard from "@/components/QuoteCard";
import VisionSnapshot from "@/components/VisionSnapshot";
import FocusGoals from "@/components/FocusGoals";
import HighImpactTasks from "@/components/HighImpactTasks";
import WorkflowSection from "@/components/WorkflowSection";
import GoalCompletionEffect from "@/components/GoalCompletionEffect";
import { Task } from "@/types";
import colors from "@/constants/colors";
import { useFocusEffect } from "@react-navigation/native";

export default function HomeScreen() {
  const store = useDigmStore();
  if (!store) return <ActivityIndicator style={{ flex: 1 }} />; // provider not ready yet
  
  const {
    loading,
    userProfile,
    quote,
    tasksByStatus,
    highImpactTasks,
    completedGoal,
    clearCompletedGoal,
    updateTask,
  } = store;

  useFocusEffect(useCallback(() => {
    store?.reloadAll?.();
  }, [store]));


  useEffect(() => {
    if (__DEV__) console.log("🏠 Home completedGoal:", completedGoal);
  }, [completedGoal]);

  const handleToggleTask = useCallback((task: Task) => {
    if (task.isCompleted || task.status === "done") return;
    updateTask({
      ...task,
      isCompleted: true,
      status: "done",
      completedAt: new Date().toISOString(),
    });
  }, [updateTask]);

  const handleMoveTask = useCallback((taskId: string, newStatus: "open" | "inProgress" | "done") => {
    const all = [...tasksByStatus.open, ...tasksByStatus.inProgress, ...tasksByStatus.done];
    const t = all.find(x => x.id === taskId);
    if (!t) return;
    updateTask({
      ...t,
      status: newStatus,
      isCompleted: newStatus === "done",
      completedAt: newStatus === "done" ? new Date().toISOString() : undefined,
    });
  }, [tasksByStatus, updateTask]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <>
      <ScrollView style={styles.container} testID="home-screen">
        <View style={styles.content}>
          <QuoteCard quote={quote.quote} author={quote.author} />
          <VisionSnapshot vision={userProfile.vision} />
          <FocusGoals />
          <HighImpactTasks tasks={highImpactTasks} onToggleTask={handleToggleTask} />
          <WorkflowSection tasks={tasksByStatus} onMoveTask={handleMoveTask} />
        </View>
      </ScrollView>

      {completedGoal && (
        <GoalCompletionEffect
          visible
          goalTitle={completedGoal.title}
          onAnimationEnd={clearCompletedGoal}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingVertical: 16, paddingBottom: 32 },
});
