import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Goal, JournalEntry, Task, UserProfile, TaskStatus } from "@/types";
import { Platform } from "react-native";
import { mockGoals, mockJournalEntries, mockTasks, mockUserProfile } from "@/mocks/data";
import { getRandomQuote } from "@/constants/quotes";
import { getLevelInfo } from "@/constants/colors";

const STORAGE_KEYS = {
  USER_PROFILE: "digm_user_profile",
  GOALS: "digm_goals",
  TASKS: "digm_tasks",
  JOURNAL_ENTRIES: "digm_journal_entries",
};

export const [DigmProvider, useDigmStore] = createContextHook(() => {
  // State
  const [userProfile, setUserProfile] = useState<UserProfile>(mockUserProfile);
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(mockJournalEntries);
  const [quote, setQuote] = useState(getRandomQuote());
  const [completedGoal, setCompletedGoal] = useState<Goal | null>(null);
  const [pinnedGoalIds, setPinnedGoalIds] = useState<string[]>([]);

  // Load data from AsyncStorage
  const loadData = useCallback(async () => {
    try {
      const storedUserProfile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      const storedGoals = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
      const storedTasks = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      const storedJournalEntries = await AsyncStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
      const storedPinnedGoals = await AsyncStorage.getItem('digm_pinned_goals');

      if (storedUserProfile) setUserProfile(JSON.parse(storedUserProfile));
      if (storedGoals) setGoals(JSON.parse(storedGoals));
      if (storedTasks) setTasks(JSON.parse(storedTasks));
      if (storedJournalEntries) setJournalEntries(JSON.parse(storedJournalEntries));
      if (storedPinnedGoals) setPinnedGoalIds(JSON.parse(storedPinnedGoals));
    } catch (error) {
      console.error("Error loading data from AsyncStorage:", error);
    }
  }, []);

  // Save data to AsyncStorage
  const saveData = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
      await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      await AsyncStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(journalEntries));
      await AsyncStorage.setItem('digm_pinned_goals', JSON.stringify(pinnedGoalIds));
    } catch (error) {
      console.error("Error saving data to AsyncStorage:", error);
    }
  }, [userProfile, goals, tasks, journalEntries, pinnedGoalIds]);

  // Load data on mount
  useEffect(() => {
    loadData();
    // Refresh quote daily
    setQuote(getRandomQuote());
  }, [loadData]);

  // Save data when state changes
  useEffect(() => {
    saveData();
  }, [userProfile, goals, tasks, journalEntries, pinnedGoalIds, saveData]);

  // Check for daily streak
  useEffect(() => {
    const checkStreak = async () => {
      const today = new Date().toISOString().split("T")[0];
      const lastActive = userProfile.lastActive.split("T")[0];

      if (today !== lastActive) {
        const updatedProfile = {
          ...userProfile,
          lastActive: new Date().toISOString(),
        };

        // If last active was yesterday, increase streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (lastActive === yesterdayStr) {
          updatedProfile.streak += 1;
          updatedProfile.xp += 3; // Streak bonus
        } else {
          // Reset streak if not consecutive
          updatedProfile.streak = 1;
        }

        setUserProfile(updatedProfile);
      }
    };

    checkStreak();
  }, [userProfile]);

  // Task mutations
  const updateTask = useCallback((updatedTask: Task) => {
    const previousTask = tasks.find(t => t.id === updatedTask.id);
    
    setTasks(currentTasks => {
      const newTasks = currentTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      );
      return newTasks;
    });

    // Update XP if task is completed
    if (updatedTask.status === "done" && previousTask?.status !== "done") {
      const xpGained = updatedTask.xpReward;
      
      setUserProfile(current => {
        const newXP = current.xp + xpGained;
        const newLevelInfo = getLevelInfo(newXP);
        
        return {
          ...current,
          xp: newXP,
          level: newLevelInfo.level
        };
      });

      // Update goal progress
      if (updatedTask.goalId) {
        setGoals(currentGoals => 
          currentGoals.map(goal => {
            if (goal.id === updatedTask.goalId) {
              const goalTasks = tasks.filter(t => t.goalId === goal.id);
              const completedTasks = goalTasks.filter(t => 
                t.id === updatedTask.id ? true : t.status === "done"
              );
              const progress = Math.round((completedTasks.length / goalTasks.length) * 100);
              
              return { ...goal, progress };
            }
            return goal;
          })
        );
      }
    }
  }, [tasks]);

  const moveTask = useCallback((taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      status: newStatus,
      isCompleted: newStatus === "done",
      completedAt: newStatus === "done" ? new Date().toISOString() : undefined,
    };

    updateTask(updatedTask);
  }, [tasks, updateTask]);

  const addTask = useCallback((newTask: Omit<Task, "id" | "createdAt">) => {
    const task: Task = {
      ...newTask,
      id: `task${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    setTasks(current => [...current, task]);
    return task;
  }, []);

  // Goal mutations
  const updateGoal = useCallback((updatedGoal: Goal) => {
    // Check if goal is newly completed (100%)
    const existingGoal = goals.find(g => g.id === updatedGoal.id);
    const isNewlyCompleted = existingGoal && existingGoal.progress < 100 && updatedGoal.progress === 100;
    
    setGoals(current => 
      current.map(goal => goal.id === updatedGoal.id ? updatedGoal : goal)
    );
    
    // If goal is newly completed, award XP and show completion effect
    if (isNewlyCompleted) {
      // Award 100 XP for completing a goal
      setUserProfile(current => {
        const newXP = current.xp + 100;
        const newLevelInfo = getLevelInfo(newXP);
        
        return {
          ...current,
          xp: newXP,
          level: newLevelInfo.level
        };
      });
      
      // Set completed goal to trigger effect
      setCompletedGoal(updatedGoal);
      
      // Clear completed goal after 5 seconds
      setTimeout(() => {
        setCompletedGoal(null);
      }, 5000);
    }
  }, [goals]);

  const addGoal = useCallback((newGoal: Omit<Goal, "id" | "progress" | "tasks">, initialTasks: Omit<Task, "id" | "createdAt" | "goalId">[] = []) => {
    const goalId = `goal${Date.now()}`;
    
    // Create the goal
    const goal: Goal = {
      ...newGoal,
      id: goalId,
      progress: 0,
      tasks: [],
    };
    
    // Add the goal
    setGoals(current => [...current, goal]);
    
    // Create tasks for this goal if provided
    if (initialTasks.length > 0) {
      const newTasks = initialTasks.map(taskData => {
        const task: Task = {
          ...taskData,
          id: `task${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          goalId,
        };
        return task;
      });
      
      // Add the tasks
      setTasks(current => [...current, ...newTasks]);
      
      // Update goal with task IDs
      const updatedGoal = {
        ...goal,
        tasks: newTasks.map(t => t.id),
      };
      
      setGoals(current => 
        current.map(g => g.id === goalId ? updatedGoal : g)
      );
      
      return updatedGoal;
    }
    
    return goal;
  }, []);

  // Journal mutations
  const addJournalEntry = useCallback((entry: Omit<JournalEntry, "id" | "xpEarned">) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: `entry${Date.now()}`,
      xpEarned: 10, // XP for adding journal entry
    };
    
    setJournalEntries(current => [newEntry, ...current]);
    
    // Update XP
    setUserProfile(current => ({
      ...current,
      xp: current.xp + newEntry.xpEarned
    }));
    
    return newEntry;
  }, []);

  // Update vision
  const updateVision = useCallback((vision: string) => {
    setUserProfile(current => ({
      ...current,
      vision
    }));
  }, []);

  // Computed values
  const highImpactTasks = useMemo(() => {
    return tasks.filter(task => task.isHighImpact && !task.isCompleted);
  }, [tasks]);

  const tasksByStatus = useMemo(() => {
    return {
      open: tasks.filter(task => task.status === "open"),
      inProgress: tasks.filter(task => task.status === "inProgress"),
      done: tasks.filter(task => task.status === "done"),
    };
  }, [tasks]);

  // Level calculation
  const nextLevelXp = useMemo(() => {
    return (userProfile.level + 1) * 100;
  }, [userProfile.level]);

  const xpProgress = useMemo(() => {
    return (userProfile.xp / nextLevelXp) * 100;
  }, [userProfile.xp, nextLevelXp]);

  // Pin/unpin goals
  const togglePinGoal = useCallback((goalId: string) => {
    setPinnedGoalIds(current => {
      if (current.includes(goalId)) {
        return current.filter(id => id !== goalId);
      } else {
        // Limit to 3 pinned goals
        const newPinned = [...current, goalId];
        return newPinned.slice(-3); // Keep only the 3 most recently pinned
      }
    });
  }, []);

  // Delete a goal and its associated tasks
  const deleteGoal = useCallback((goalId: string) => {
    // Remove the goal
    setGoals(current => current.filter(goal => goal.id !== goalId));
    
    // Remove all tasks associated with this goal
    setTasks(current => current.filter(task => task.goalId !== goalId));
    
    // Remove from pinned goals if it was pinned
    setPinnedGoalIds(current => current.filter(id => id !== goalId));
  }, []);

  return {
    userProfile,
    goals,
    tasks,
    journalEntries,
    quote,
    highImpactTasks,
    tasksByStatus,
    nextLevelXp,
    xpProgress,
    completedGoal,
    pinnedGoalIds,
    updateTask,
    moveTask,
    addTask,
    updateGoal,
    addGoal,
    deleteGoal,
    addJournalEntry,
    updateVision,
    togglePinGoal,
    refreshQuote: () => setQuote(getRandomQuote()),
    clearCompletedGoal: () => setCompletedGoal(null),
  };
});

// Custom hooks for specific data needs
export function useHighImpactTasks() {
  const { tasks } = useDigmStore();
  return useMemo(() => {
    return tasks.filter(task => task.isHighImpact && !task.isCompleted).slice(0, 3);
  }, [tasks]);
}

export function useGoalsPreview() {
  const { goals, pinnedGoalIds, togglePinGoal } = useDigmStore();
  
  return useMemo(() => {
    // If there are pinned goals, show those first
    if (pinnedGoalIds.length > 0) {
      const pinnedGoals = goals.filter(goal => pinnedGoalIds.includes(goal.id));
      
      // If we have fewer than 3 pinned goals, add some unpinned ones
      if (pinnedGoals.length < 3) {
        const unpinnedGoals = goals
          .filter(goal => !pinnedGoalIds.includes(goal.id))
          .sort((a, b) => {
            // Sort by due date (closest first)
            const dateA = new Date(a.dueDate);
            const dateB = new Date(b.dueDate);
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 3 - pinnedGoals.length);
        
        return [...pinnedGoals, ...unpinnedGoals];
      }
      
      return pinnedGoals.slice(0, 3);
    }
    
    // If no pinned goals, show the first 3 goals sorted by due date
    return goals
      .sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 3);
  }, [goals, pinnedGoalIds]);
}

export function useFocusGoals() {
  const { goals, pinnedGoalIds, tasks } = useDigmStore();
  
  return useMemo(() => {
    // Get pinned goals or most urgent goals
    let focusGoals = [];
    
    if (pinnedGoalIds.length > 0) {
      // Use pinned goals
      focusGoals = goals
        .filter(goal => pinnedGoalIds.includes(goal.id))
        .slice(0, 3);
    } else {
      // Use goals with closest due dates
      focusGoals = [...goals]
        .sort((a, b) => {
          const dateA = new Date(a.dueDate);
          const dateB = new Date(b.dueDate);
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 3);
    }
    
    // Enhance goals with task information
    return focusGoals.map(goal => {
      const goalTasks = tasks.filter(task => task.goalId === goal.id);
      const completedTasks = goalTasks.filter(task => task.status === 'done');
      const totalXP = completedTasks.reduce((sum, task) => sum + task.xpReward, 0);
      
      return {
        ...goal,
        totalTasks: goalTasks.length,
        completedTasks: completedTasks.length,
        earnedXP: totalXP
      };
    });
  }, [goals, pinnedGoalIds, tasks]);
}