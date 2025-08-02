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

      if (storedUserProfile) setUserProfile(JSON.parse(storedUserProfile));
      if (storedGoals) setGoals(JSON.parse(storedGoals));
      if (storedTasks) setTasks(JSON.parse(storedTasks));
      if (storedJournalEntries) setJournalEntries(JSON.parse(storedJournalEntries));
      if (storedPinned) setPinnedGoalIds(JSON.parse(storedPinned));
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

    setTasks(ts => ts.map(t => (t.id === updated.id ? updated : t)));

    if (updated.status === "done" && prev?.status !== "done") {
      setUserProfile(up => {
        const xp = up.xp + updated.xpReward;
        const level = getLevelInfo(xp).level;
        return { ...up, xp, level };
      });

      if (updated.goalId) {
        setGoals(gs =>
          gs.map(goal => {
            if (goal.id === updated.goalId) {
              const goalTasks = tasks.filter(t => t.goalId === goal.id);
              const doneTasks = goalTasks.filter(t => t.id === updated.id || t.status === "done");
              const progress = Math.round((doneTasks.length / goalTasks.length) * 100);
              return { ...goal, progress };
            }
            return goal;
          })
        );
      }
    }
  }, [tasks]);

  const moveTask = useCallback((id: string, status: TaskStatus) => {
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    updateTask({ ...t, status, isCompleted: status === "done", completedAt: status === "done" ? new Date().toISOString() : undefined });
  }, [tasks, updateTask]);

  const addTask = useCallback((t: Omit<Task, "id" | "createdAt">) => {
    const task: Task = { ...t, id: `task${Date.now()}`, createdAt: new Date().toISOString() };
    setTasks(ts => [...ts, task]);
    return task;
  }, []);

  const updateGoal = useCallback((updated: Goal) => {
    const existing = goals.find(g => g.id === updated.id);
    const isCompleted = existing && existing.progress < 100 && updated.progress === 100;

    setGoals(gs => gs.map(g => g.id === updated.id ? updated : g));

    if (isCompleted) {
      setUserProfile(up => {
        const xp = up.xp + 100;
        const level = getLevelInfo(xp).level;
        return { ...up, xp, level };
      });

      setCompletedGoal(updated);
      setTimeout(() => setCompletedGoal(null), 5000);
    }
  }, [goals]);

  const addGoal = useCallback((g: Omit<Goal, "id" | "progress" | "tasks">, initialTasks: Omit<Task, "id" | "createdAt" | "goalId">[] = []) => {
    const id = `goal${Date.now()}`;
    const goal: Goal = { ...g, id, progress: 0, tasks: [] };
    setGoals(gs => [...gs, goal]);

    if (initialTasks.length) {
      const newTasks = initialTasks.map(t => ({
        ...t,
        id: `task${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        goalId: id,
      }));

      setTasks(ts => [...ts, ...newTasks]);
      setGoals(gs => gs.map(g => g.id === id ? { ...g, tasks: newTasks.map(t => t.id) } : g));
    }

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

  const togglePinGoal = useCallback((id: string) => {
    setPinnedGoalIds(pinned => {
      const updated = pinned.includes(id)
        ? pinned.filter(gid => gid !== id)
        : [...pinned, id].slice(-3);
      AsyncStorage.setItem(STORAGE_KEYS.PINNED_GOALS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals(current => {
      const updated = current.filter(g => g.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updated));
      return updated;
    });

    setTasks(current => {
      const updated = current.filter(t => t.goalId !== id);
      AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
      return updated;
    });

    setPinnedGoalIds(current => {
      const updated = current.filter(gid => gid !== id);
      AsyncStorage.setItem(STORAGE_KEYS.PINNED_GOALS, JSON.stringify(updated));
      return updated;
    });

    setTimeout(() => saveData(), 250); // backup write
  }, [saveData]);

  const highImpactTasks = useMemo(() => tasks.filter(t => t.isHighImpact && !t.isCompleted), [tasks]);
  const tasksByStatus = useMemo(() => ({
    open: tasks.filter(t => t.status === "open"),
    inProgress: tasks.filter(t => t.status === "inProgress"),
    done: tasks.filter(t => t.status === "done"),
  }), [tasks]);

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
    nextLevelXp,
    xpProgress,
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
