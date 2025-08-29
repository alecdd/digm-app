import React, { useCallback, useEffect,useRef } from "react";
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
    reloadAll,
    goals,
    tasks,
  } = store;

  // Debug logging
  useEffect(() => {
    console.log("[Home] Store state:", {
      loading,
      goalsCount: goals?.length || 0,
      tasksCount: tasks?.length || 0,
      userProfile: { vision: userProfile.vision, xp: userProfile.xp, level: userProfile.level },
      highImpactTasksCount: highImpactTasks?.length || 0,
      tasksByStatus: {
        open: tasksByStatus.open?.length || 0,
        inProgress: tasksByStatus.inProgress?.length || 0,
        done: tasksByStatus.done?.length || 0,
      }
    });
  }, [loading, goals, tasks, userProfile, highImpactTasks, tasksByStatus]);

  const didFocusOnce = useRef(false);
  const reloadAttempts = useRef(0);
  const lastUserId = useRef<string | null>(null);
  const hasAttemptedReload = useRef(false);
  
  useFocusEffect(
    useCallback(() => {
      if (didFocusOnce.current) return;
      didFocusOnce.current = true;
      store?.reloadAll?.();
    }, [store?.reloadAll]) // depend only on the method
  );

  // Fallback: ensure data is loaded when component mounts
  useEffect(() => {
    // Only trigger if we haven't loaded data and haven't already attempted a reload
    if (!loading && !store?.goals?.length && !store?.tasks?.length && !hasAttemptedReload.current) {
      console.log("[Home] No data found, triggering reload (attempt", reloadAttempts.current + 1, ")");
      hasAttemptedReload.current = true;
      reloadAttempts.current += 1;
      store?.reloadAll?.();
    } else if (hasAttemptedReload.current) {
      console.log("[Home] Already attempted reload, not triggering again");
    }
  }, [loading, store?.goals?.length, store?.tasks?.length, store?.reloadAll]);

  // Additional fallback: if user is authenticated but no data after a delay
  useEffect(() => {
    if (store?.userId && !loading && !store?.goals?.length && !store?.tasks?.length) {
      const timer = setTimeout(() => {
        if (!store?.goals?.length && !store?.tasks?.length) {
          console.log("[Home] User authenticated but no data after delay, forcing reload");
          store?.reloadAll?.();
        }
      }, 2000); // Wait 2 seconds for data to load
      
      return () => clearTimeout(timer);
    }
  }, [store?.userId, loading, store?.goals?.length, store?.tasks?.length, store?.reloadAll]);

  // Reset reload attempts when user changes
  useEffect(() => {
    const currentUserId = store?.userId;
    if (currentUserId && currentUserId !== lastUserId.current) {
      console.log("[Home] User changed, resetting reload attempts");
      lastUserId.current = currentUserId;
      reloadAttempts.current = 0;
      hasAttemptedReload.current = false;
    }
  }, [store?.userId]);


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

  // Safety check - ensure all required data is available before rendering
  if (!quote?.quote || !quote?.author) {
    console.log("[Home] Required data not available, showing loading");
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <>
      <ScrollView style={styles.container} testID="home-screen">
        <View style={styles.content}>
          <QuoteCard quote={quote.quote} author={quote.author} />
          <VisionSnapshot vision={userProfile.vision} />
          <FocusGoals />
          <HighImpactTasks tasks={highImpactTasks || []} onToggleTask={handleToggleTask} />
          <WorkflowSection tasks={tasksByStatus || { open: [], inProgress: [], done: [] }} onMoveTask={handleMoveTask} />
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
