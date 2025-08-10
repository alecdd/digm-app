// hooks/useDigmStore.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Goal, JournalEntry, Task, TaskStatus, UserProfile } from "@/types";
import { getRandomQuote } from "@/constants/quotes";
import { getLevelInfo } from "@/constants/colors";
import { mockGoals, mockJournalEntries, mockTasks, mockUserProfile } from "@/mocks/data";

const STORAGE_KEYS = {
  USER_PROFILE: "digm_user_profile",
  GOALS: "digm_goals",
  TASKS: "digm_tasks",
  JOURNAL_ENTRIES: "digm_journal_entries",
  PINNED_GOALS: "digm_pinned_goals",
};

export const [DigmProvider, useDigmStore] = createContextHook(() => {
  const [userProfile, setUserProfile] = useState<UserProfile>(mockUserProfile);
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(mockJournalEntries);
  const [quote, setQuote] = useState(getRandomQuote());
  const [completedGoal, setCompletedGoal] = useState<Goal | null>(null);
  const [pinnedGoalIds, setPinnedGoalIds] = useState<string[]>([]);

  const calculateGoalProgress = useCallback((goalId: string) => {
    const goalTasks = tasks.filter(t => t.goalId === goalId);
    const completedTasks = goalTasks.filter(t => t.status === "done").length;
    const totalTasks = goalTasks.length || 1; // Ensure at least 1 to avoid division by zero
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }, [tasks]);

  // Recalculate progress for all goals whenever tasks change
  useEffect(() => {
    setGoals(currentGoals => {
      return currentGoals.map(goal => {
        const calculatedProgress = calculateGoalProgress(goal.id);
        return { ...goal, progress: calculatedProgress };
      });
    });
  }, [tasks, calculateGoalProgress]);

  const loadData = useCallback(async () => {
    try {
      const [storedUserProfile, storedGoals, storedTasks, storedJournalEntries, storedPinned] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE),
          AsyncStorage.getItem(STORAGE_KEYS.GOALS),
          AsyncStorage.getItem(STORAGE_KEYS.TASKS),
          AsyncStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES),
          AsyncStorage.getItem(STORAGE_KEYS.PINNED_GOALS),
        ]);

      console.log('Loading data from AsyncStorage:');
      console.log('- Pinned goals:', storedPinned);
      
      if (storedUserProfile) setUserProfile(JSON.parse(storedUserProfile));
      if (storedGoals) setGoals(JSON.parse(storedGoals));
      if (storedTasks) setTasks(JSON.parse(storedTasks));
      if (storedJournalEntries) setJournalEntries(JSON.parse(storedJournalEntries));
      
      if (storedPinned) {
        const parsedPinned = JSON.parse(storedPinned);
        console.log('- Parsed pinned goals:', parsedPinned);
        setPinnedGoalIds(parsedPinned);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    }
  }, []);

  const saveData = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile)),
        AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals)),
        AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks)),
        AsyncStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(journalEntries)),
        AsyncStorage.setItem(STORAGE_KEYS.PINNED_GOALS, JSON.stringify(pinnedGoalIds)),
      ]);
    } catch (err) {
      console.error("Error saving data:", err);
    }
  }, [userProfile, goals, tasks, journalEntries, pinnedGoalIds]);

  useEffect(() => {
    loadData();
    setQuote(getRandomQuote());
  }, [loadData]);

  // Sync level with XP on profile changes
  useEffect(() => {
    const correctLevelInfo = getLevelInfo(userProfile.xp);
    if (userProfile.level !== correctLevelInfo.level) {
      console.log(`Syncing level: XP ${userProfile.xp} should be level ${correctLevelInfo.level}, but was ${userProfile.level}`);
      setUserProfile(up => ({ ...up, level: correctLevelInfo.level }));
    }
  }, [userProfile.xp]);

  useEffect(() => {
    saveData();
  }, [userProfile, goals, tasks, journalEntries, pinnedGoalIds]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const last = userProfile.lastActive.split("T")[0];

    if (today !== last) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const newProfile = {
        ...userProfile,
        lastActive: new Date().toISOString(),
        streak: last === yesterdayStr ? userProfile.streak + 1 : 1,
        xp: last === yesterdayStr ? userProfile.xp + 3 : userProfile.xp,
      };

      setUserProfile(newProfile);
    }
  }, [userProfile]);

  const updateTask = useCallback((updated: Task) => {
    const prev = tasks.find(t => t.id === updated.id);

    // If task is already completed, don't allow changing it back
    if (prev?.isCompleted || prev?.status === "done") {
      console.log('Task is already completed, cannot change state');
      return;
    }

    // Ensure isCompleted flag matches status
    const taskToUpdate = {
      ...updated,
      isCompleted: updated.status === "done",
      completedAt: updated.status === "done" ? (updated.completedAt || new Date().toISOString()) : undefined
    };

    console.log('Updating task:', taskToUpdate.title, 'Status:', taskToUpdate.status, 'IsCompleted:', taskToUpdate.isCompleted);

    // Award XP for task completion
    if (updated.status === "done") {
      console.log('✅ Task completed:', updated.title);
      const xpReward = updated.isHighImpact ? 15 : 5;
      
      setUserProfile(up => {
        const xp = up.xp + xpReward;
        const levelInfo = getLevelInfo(xp);
        console.log(`Awarded ${xpReward} XP for task completion. Total XP: ${xp}, Level: ${levelInfo.level}`);
        return { ...up, xp, level: levelInfo.level };
      });
    }
    
    // Update tasks and check for goal completion
    setTasks(currentTasks => {
      const updatedTasks = currentTasks.map(t => t.id === taskToUpdate.id ? taskToUpdate : t);
      
      // Check goal completion immediately with the updated tasks
      const goalId = taskToUpdate.goalId;
      if (goalId) {
        const goalTasks = updatedTasks.filter(t => t.goalId === goalId);
        const completedTasks = goalTasks.filter(t => t.status === "done");
        const progress = goalTasks.length > 0 ? Math.round((completedTasks.length / goalTasks.length) * 100) : 0;
        
        console.log(`🎯 Goal ${goalId} progress: ${completedTasks.length}/${goalTasks.length} = ${progress}%`);
        
        // Update goal progress and check for completion
        setGoals(currentGoals => {
          return currentGoals.map(goal => {
            if (goal.id === goalId) {
              const updatedGoal = { ...goal, progress };
              
              // Check if goal is newly completed
              if (progress === 100 && goal.progress < 100) {
                console.log('🎉🎉🎉 GOAL COMPLETED:', goal.title);
                console.log('🎯 Goal progress changed from', goal.progress, 'to', progress);
                console.log('🎯 Goal tasks:', goalTasks.length, 'Completed tasks:', completedTasks.length);
                
                // Award XP for goal completion
                setUserProfile(up => {
                  const xp = up.xp + 50; // 50 XP for goal completion
                  const levelInfo = getLevelInfo(xp);
                  console.log(`🏆 Awarded 50 XP for goal completion! Total XP: ${xp}, Level: ${levelInfo.level}`);
                  return { ...up, xp, level: levelInfo.level };
                });
                
                // Unpin the goal if it's pinned
                if (pinnedGoalIds.includes(goal.id)) {
                  console.log('📌 Unpinning completed goal:', goal.id);
                  setPinnedGoalIds(current => current.filter(id => id !== goal.id));
                }
                
                // Set completed goal to trigger animation, but only if not leveling up
                console.log('🎊 Setting completed goal for animation:', updatedGoal.title);
                console.log('🎊 completedGoal state will be set to:', updatedGoal);
                
                // Check if we're leveling up - if so, don't show goal completion animation
                const currentXp = userProfile.xp;
                const levelInfo = getLevelInfo(currentXp);
                const newLevelInfo = getLevelInfo(currentXp + 50);
                
                console.log(`🔄 Level check: Current XP: ${currentXp}, Current level: ${levelInfo.level}`);
                console.log(`🔄 Level check: After +50 XP: ${currentXp + 50}, New level: ${newLevelInfo.level}`);
                console.log(`🔄 Will level up? ${levelInfo.level !== newLevelInfo.level ? 'YES' : 'NO'}`);
                
                // Always prioritize level up animation over goal completion
                if (levelInfo.level !== newLevelInfo.level) {
                  console.log('🎊 Level up detected! Skipping goal completion animation');
                  // Ensure completed goal is null to prevent any chance of both animations showing
                  setCompletedGoal(null);
                } else {
                  // No level up, show goal completion
                  setCompletedGoal(updatedGoal);
                  
                  // Clear completed goal state after animation (but keep goal in profile)
                  setTimeout(() => {
                    console.log('🎊 Clearing completed goal animation state:', goal.title);
                    setCompletedGoal(null);
                  }, 5500);
                }
              }
              
              return updatedGoal;
            }
            return goal;
          });
        });
      }
      
      return updatedTasks;
    });
  }, [tasks, pinnedGoalIds]);

  const moveTask = useCallback((id: string, status: TaskStatus) => {
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    
    // If task is already completed, don't allow changing it
    if (t.isCompleted || t.status === "done") {
      console.log('Task is already completed, cannot change state');
      return;
    }
    
    updateTask({ ...t, status, isCompleted: status === "done", completedAt: status === "done" ? new Date().toISOString() : undefined });
  }, [tasks, updateTask]);

  const addTask = useCallback((t: Omit<Task, "id" | "createdAt">) => {
    const task: Task = { ...t, id: `task${Date.now()}`, createdAt: new Date().toISOString() };
    setTasks(ts => [...ts, task]);
    return task;
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(ts => ts.filter(t => t.id !== taskId));
    
    // Update goal progress if the task was tied to a goal
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (taskToDelete?.goalId) {
      setGoals(gs => gs.map(goal => {
        if (goal.id === taskToDelete.goalId) {
          const remainingGoalTasks = tasks.filter(t => t.goalId === goal.id && t.id !== taskId);
          const completedTasks = remainingGoalTasks.filter(t => t.status === "done");
          const progress = remainingGoalTasks.length > 0 ? Math.round((completedTasks.length / remainingGoalTasks.length) * 100) : 0;
          return { ...goal, progress, tasks: goal.tasks.filter(tId => tId !== taskId) };
        }
        return goal;
      }));
    }
  }, [tasks]);

  const updateGoal = useCallback((updated: Goal) => {
    const existing = goals.find(g => g.id === updated.id);
    
    // Calculate progress based on task completion ratio
    const goalTasks = tasks.filter(t => t.goalId === updated.id);
    const completedTasks = goalTasks.filter(t => t.status === "done");
    const calculatedProgress = goalTasks.length > 0 
      ? Math.round((completedTasks.length / goalTasks.length) * 100) 
      : 0;
    
    // Update the goal with calculated progress
    const updatedWithProgress = {
      ...updated,
      progress: calculatedProgress
    };
    
    // Check if goal is newly completed
    const isCompleted = existing && existing.progress < 100 && calculatedProgress === 100;

    setGoals(gs => gs.map(g => g.id === updated.id ? updatedWithProgress : g));
    
    // Ensure all goals have their progress recalculated
    setTimeout(() => {
      setGoals(currentGoals => {
        return currentGoals.map(g => {
          if (g.id === updated.id) return updatedWithProgress;
          
          const gTasks = tasks.filter(t => t.goalId === g.id);
          const gCompletedTasks = gTasks.filter(t => t.status === "done");
          const gProgress = gTasks.length > 0 
            ? Math.round((gCompletedTasks.length / gTasks.length) * 100) 
            : 0;
          
          return { ...g, progress: gProgress };
        });
      });
    }, 100);

    if (isCompleted) {
      console.log('Goal completed via updateGoal:', updated.title);
      
      setUserProfile(up => {
        const xp = up.xp + 50; // Goal completion reward is 50 XP (25 XP base + 25 XP bonus)
        const levelInfo = getLevelInfo(xp);
        return { ...up, xp, level: levelInfo.level };
      });
      
      // Unpin the goal if it's pinned
      if (pinnedGoalIds.includes(updated.id)) {
        console.log('Unpinning completed goal:', updated.id);
        setPinnedGoalIds(current => current.filter(id => id !== updated.id));
      }
      
      // Set completed goal to trigger animation, but only if not leveling up
      const currentXp = userProfile.xp;
      const levelInfo = getLevelInfo(currentXp);
      const newLevelInfo = getLevelInfo(currentXp + 50);
      
      console.log(`🔄 Level check (updateGoal): Current XP: ${currentXp}, Current level: ${levelInfo.level}`);
      console.log(`🔄 Level check (updateGoal): After +50 XP: ${currentXp + 50}, New level: ${newLevelInfo.level}`);
      console.log(`🔄 Will level up? ${levelInfo.level !== newLevelInfo.level ? 'YES' : 'NO'}`);
      
      // Always prioritize level up animation over goal completion
      if (levelInfo.level !== newLevelInfo.level) {
        console.log('🎊 Level up detected! Skipping goal completion animation');
        // Ensure completed goal is null to prevent any chance of both animations showing
        setCompletedGoal(null);
      } else {
        // No level up, show goal completion
        setCompletedGoal(updatedWithProgress);
        
        // Clear completed goal state after animation (but keep goal in profile)
        setTimeout(() => {
          setCompletedGoal(null);
        }, 5500);
      }
    }
    
    return updatedWithProgress;
  }, [goals, tasks]);

  const addGoal = useCallback((g: Omit<Goal, "id" | "progress" | "tasks">, initialTasks: Omit<Task, "id" | "createdAt" | "goalId">[] = []) => {
    const id = `goal${Date.now()}`;
    const goal: Goal = { ...g, id, progress: 0, tasks: [] };
    setGoals(gs => [...gs, goal]);

    // If no tasks provided, create a default task with the goal name
    if (initialTasks.length === 0) {
      initialTasks = [{
        title: `Complete ${g.title}`,
        status: 'open',
        isHighImpact: true,
        isCompleted: false,
        xpReward: 15 // High impact tasks are worth 15 XP
      }];
      console.log('Created default task for goal:', g.title);
    }

    // Generate unique IDs for each task
    const newTasks = initialTasks.map(t => {
      const taskId = `task${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log(`Created task: ${t.title} with ID: ${taskId} for goal: ${id}`);
      return {
        ...t,
        id: taskId,
        createdAt: new Date().toISOString(),
        goalId: id,
      };
    });

    setTasks(ts => [...ts, ...newTasks]);
    
    // Update the goal with the task IDs and set progress to 0 initially
    const taskIds = newTasks.map(t => t.id);
    console.log(`Updating goal ${id} with task IDs:`, taskIds);
    
    setGoals(gs => gs.map(g => {
      if (g.id === id) {
        return { 
          ...g, 
          tasks: taskIds,
          progress: 0 // Explicitly set to 0 since no tasks are completed yet
        };
      }
      return g;
    }));

    return goal;
  }, []);

  const addJournalEntry = useCallback((e: Omit<JournalEntry, "id" | "xpEarned">) => {
    const newEntry: JournalEntry = { ...e, id: `entry${Date.now()}`, xpEarned: 10 };
    setJournalEntries(es => [newEntry, ...es]);
    setUserProfile(up => ({ ...up, xp: up.xp + newEntry.xpEarned }));
    return newEntry;
  }, []);

  const updateVision = useCallback((vision: string) => {
    setUserProfile(up => ({ ...up, vision }));
  }, []);

  const togglePinGoal = useCallback(async (id: string) => {
    console.log('togglePinGoal called with ID:', id);
    
    // Get the current state first
    setPinnedGoalIds(currentPinned => {
      console.log('Current pinned goals:', currentPinned);
      
      // Check if the goal is already pinned
      const isPinned = currentPinned.includes(id);
      console.log('Is goal already pinned?', isPinned);
      
      // Create the updated array - either remove the goal or add it (limiting to 3 pinned goals)
      const updated = isPinned
        ? currentPinned.filter(gid => gid !== id)
        : [...currentPinned, id].slice(-3);
      
      console.log('Updated pinned goals:', updated);
      
      // Persist the change to AsyncStorage
      AsyncStorage.setItem(STORAGE_KEYS.PINNED_GOALS, JSON.stringify(updated))
        .then(() => console.log('Pinned goals saved to AsyncStorage'))
        .catch(err => console.error('Error saving pinned goals:', err));
      
      return updated;
    });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    // Compute updated values
    const updatedGoals = goals.filter(g => g.id !== id);
    const updatedTasks = tasks.filter(t => t.goalId !== id);
    const updatedPinned = pinnedGoalIds.filter(gid => gid !== id);

    // Update state to trigger re-render
    setGoals(updatedGoals);
    setTasks(updatedTasks);
    setPinnedGoalIds(updatedPinned);

    // Persist changes to AsyncStorage
    AsyncStorage.multiSet([
      [STORAGE_KEYS.GOALS, JSON.stringify(updatedGoals)],
      [STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks)],
      [STORAGE_KEYS.PINNED_GOALS, JSON.stringify(updatedPinned)],
    ])
      .then(() => {
        console.log("✅ Goal deleted and changes saved:", id);
      })
      .catch((err) => {
        console.error("❌ Error saving after deleting goal:", err);
      });
  }, [goals, tasks, pinnedGoalIds]);

  const highImpactTasks = useMemo(() => tasks.filter(t => t.isHighImpact && !t.isCompleted), [tasks]);
  const tasksByStatus = useMemo(() => ({
    open: tasks.filter(t => t.status === "open"),
    inProgress: tasks.filter(t => t.status === "inProgress"),
    done: tasks.filter(t => t.status === "done"),
  }), [tasks]);

  const focusGoals = useMemo(() => {
    return goals.filter(goal => {
      // Only include pinned goals that are not completed (progress < 100)
      // This ensures completed goals are unpinned from home screen
      return pinnedGoalIds.includes(goal.id) && goal.progress < 100;
    }).map(goal => {
      const goalTasks = tasks.filter(t => t.goalId === goal.id);
      const completedTasks = goalTasks.filter(t => t.status === "done").length;
      const totalTasks = goalTasks.length || 1;
      const earnedXP = goalTasks.reduce((sum, t) => t.status === "done" ? sum + (t.xpReward || 0) : sum, 0);
      
      // Calculate accurate progress based on task completion
      const calculatedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return {
        ...goal,
        progress: calculatedProgress, // Override the stored progress with calculated value
        completedTasks,
        totalTasks,
        earnedXP
      };
    });
  }, [goals, pinnedGoalIds, tasks]);

  const nextLevelXp = useMemo(() => (userProfile.level + 1) * 100, [userProfile.level]);
  const xpProgress = useMemo(() => (userProfile.xp / nextLevelXp) * 100, [userProfile.xp, nextLevelXp]);

  return {
    userProfile,
    goals,
    tasks,
    journalEntries,
    quote,
    completedGoal,
    pinnedGoalIds,
    highImpactTasks,
    tasksByStatus,
    focusGoals,
    nextLevelXp,
    xpProgress,
    calculateGoalProgress,
    updateTask,
    moveTask,
    addTask,
    deleteTask,
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
