// hooks/useDigmStore.ts
// hooks/useDigmStore.ts
import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Goal, JournalEntry, Task, TaskStatus, UserProfile } from "@/types";
import { getRandomQuote } from "@/constants/quotes";
import { getLevelInfo } from "@/constants/colors";

import { supabase } from "@/lib/supabase";
import { ensureProfile } from "@/lib/supa-user";


// ---- Helpers --------------------------------------------------

function calcGoalProgress(tasksForGoal: Task[]) {
  const total = tasksForGoal.length || 1;
  const done = tasksForGoal.filter(t => t.status === "done").length;
  return Math.round((done / total) * 100);
}

function toProfile(u: any): UserProfile {
  return {
    vision: u.vision ?? "",
    xp: u.xp ?? 0,
    level: u.level ?? 1,
    streak: u.streak ?? 0,
    lastActive: u.last_active ?? new Date().toISOString(),
  };
}

// ---- Store ----------------------------------------------------

export const [DigmProvider, useDigmStore] = createContextHook(() => {
  // Core state
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    vision: "",
    xp: 0,
    level: 1,
    streak: 0,
    lastActive: new Date().toISOString(),
  });

  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [pinnedGoalIds, setPinnedGoalIds] = useState<string[]>([]);
  const [quote, setQuote] = useState(getRandomQuote());
  const [completedGoal, setCompletedGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- Initial load (auth + data) -----------------------------

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const user = await ensureProfile(); // signs in (dev) and guarantees a profile row
        setUserId(user.id);

        // profiles
        {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
          if (error) throw error;
          if (data) setUserProfile(toProfile(data));
        }

        // pinned goals
        {
          const { data, error } = await supabase
            .from("pinned_goals")
            .select("goal_id")
            .eq("user_id", user.id);
          if (error) throw error;
          setPinnedGoalIds((data ?? []).map(r => r.goal_id as string));
        }

        // goals
        {
          const { data, error } = await supabase
            .from("goals")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });
          if (error) throw error;
          setGoals(
            (data ?? []).map((g: any) => ({
              id: g.id,
              title: g.title,
              dueDate: g.due_date,
              progress: g.progress ?? 0,
              timeframe: g.timeframe,
              tasks: [], // filled below after tasks load
              specific: g.specific ?? undefined,
              measurable: g.measurable ?? undefined,
              achievable: g.achievable ?? undefined,
              relevant: g.relevant ?? undefined,
              timeBound: g.time_bound ?? undefined,
            }))
          );
        }

        // tasks
        {
          const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });
          if (error) throw error;

          const mapped: Task[] = (data ?? []).map((t: any) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            isHighImpact: !!t.is_high_impact,
            isCompleted: t.status === "done",
            goalId: t.goal_id ?? undefined,
            xpReward: t.xp_reward ?? (t.is_high_impact ? 15 : 5),
            createdAt: t.created_at,
            completedAt: t.completed_at ?? undefined,
          }));

          setTasks(mapped);

          // backfill goal -> tasks relation in state
          setGoals(g =>
            g.map(goal => ({
              ...goal,
              tasks: mapped.filter(t => t.goalId === goal.id).map(t => t.id),
              progress: calcGoalProgress(mapped.filter(t => t.goalId === goal.id)),
            }))
          );
        }

        // journal entries
        {
          const { data, error } = await supabase
            .from("journal_entries")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          if (error) throw error;

          setJournalEntries(
            (data ?? []).map((j: any) => ({
              id: j.id,
              date: j.created_at,
              content: j.content ?? "",
              accomplishments: j.accomplishments ?? "",
              blockers: j.blockers ?? "",
              gratitude: j.gratitude ?? "",
              valueServed: j.value_served ?? "",
              xpEarned: j.xp_earned ?? 10,
            }))
          );
        }
      } catch (e) {
        console.error("Initial load failed:", e);
      } finally {
        setLoading(false);
        setQuote(getRandomQuote());
      }
    })();
  }, []);

  // ---- Progress helpers ---------------------------------------

  const calculateGoalProgress = useCallback(
    (goalId: string) => calcGoalProgress(tasks.filter(t => t.goalId === goalId)),
    [tasks]
  );

  // keep goal.progress in sync any time tasks change
  useEffect(() => {
    setGoals(gs =>
      gs.map(g => ({ ...g, progress: calculateGoalProgress(g.id) }))
    );
  }, [tasks, calculateGoalProgress]);

  // ---- Profile helpers (XP/Level, vision/streak) ---------------

  const bumpXP = useCallback(
    async (delta: number) => {
      setUserProfile(prev => {
        const xp = prev.xp + delta;
        const levelInfo = getLevelInfo(xp);
        return { ...prev, xp, level: levelInfo.level };
      });
      if (!userId) return;
      const newXP = userProfile.xp + delta;
      const { error } = await supabase
        .from("profiles")
        .update({ xp: newXP, level: getLevelInfo(newXP).level })
        .eq("id", userId);
      if (error) console.error("Failed to persist XP:", error);
    },
    [userId, userProfile.xp]
  );

  const updateVision = useCallback(
    async (vision: string) => {
      setUserProfile(up => ({ ...up, vision }));
      if (!userId) return;
      const { error } = await supabase
        .from("profiles")
        .update({ vision })
        .eq("id", userId);
      if (error) console.error("Failed to update vision:", error);
    },
    [userId]
  );

  // ---- Tasks ---------------------------------------------------

  const addTask = useCallback(
    async (t: Omit<Task, "id" | "createdAt">) => {
      if (!userId) return null;
      const payload = {
        user_id: userId,
        title: t.title,
        status: t.status,
        is_high_impact: t.isHighImpact,
        goal_id: t.goalId ?? null,
        xp_reward: t.xpReward ?? (t.isHighImpact ? 15 : 5),
      };
      const { data, error } = await supabase
        .from("tasks")
        .insert(payload)
        .select("*")
        .maybeSingle();
      if (error) {
        console.error("addTask failed:", error);
        return null;
      }
      const task: Task = {
        id: data.id,
        title: data.title,
        status: data.status,
        isHighImpact: !!data.is_high_impact,
        isCompleted: data.status === "done",
        goalId: data.goal_id ?? undefined,
        xpReward: data.xp_reward ?? (data.is_high_impact ? 15 : 5),
        createdAt: data.created_at,
        completedAt: data.completed_at ?? undefined,
      };
      setTasks(ts => [...ts, task]);
      // ensure goal linkage in state
      if (task.goalId) {
        setGoals(gs =>
          gs.map(g =>
            g.id === task.goalId
              ? { ...g, tasks: [...g.tasks, task.id], progress: calculateGoalProgress(g.id) }
              : g
          )
        );
      }
      return task;
    },
    [userId, calculateGoalProgress]
  );

  const updateTask = useCallback(
    async (updated: Task) => {
      // prevent changing completed tasks back
      const prev = tasks.find(t => t.id === updated.id);
      // compute once
      const wasDoneBefore = !!(prev?.isCompleted || prev?.status === 'done');
      // guard
      if (wasDoneBefore) {
        console.log('Task already completed; ignoring changes.');
        return;
      }

      const isNowDone = updated.status === "done";
      const patch: any = {
        title: updated.title,
        status: updated.status,
        is_high_impact: updated.isHighImpact,
        goal_id: updated.goalId ?? null,
      };
      if (isNowDone) patch.completed_at = new Date().toISOString();

      const { error } = await supabase.from("tasks").update(patch).eq("id", updated.id);
      if (error) {
        console.error("updateTask failed:", error);
        return;
      }

      const taskToUpdate: Task = {
        ...updated,
        isCompleted: isNowDone,
        completedAt: isNowDone ? (updated.completedAt ?? new Date().toISOString()) : undefined,
      };

      // local update
      setTasks(ts => ts.map(t => (t.id === taskToUpdate.id ? taskToUpdate : t)));

      // XP for completing a task (only if it wasn't already done)
      if (isNowDone && !wasDoneBefore) {
        const xpReward = updated.isHighImpact ? 15 : 5;
        await bumpXP(xpReward);
      }

      // recompute & persist goal progress
      if (taskToUpdate.goalId) {
        const goalId = taskToUpdate.goalId;
        const progress = calculateGoalProgress(goalId);
        setGoals(gs => gs.map(g => (g.id === goalId ? { ...g, progress } : g)));
        const { error: gErr } = await supabase
          .from("goals")
          .update({ progress })
          .eq("id", goalId);
        if (gErr) console.error("Persist goal progress failed:", gErr);

        // goal completion reward
        const goal = goals.find(g => g.id === goalId);
        if (goal && goal.progress < 100 && progress === 100) {
          await bumpXP(50);
          // show completion animation unless level-up happens (same behavior)
          setCompletedGoal({ ...goal, progress: 100 });
          setTimeout(() => setCompletedGoal(null), 5500);
        }
      }
    },
    [tasks, calculateGoalProgress, goals, bumpXP]
  );

  const moveTask = useCallback(
    async (id: string, status: TaskStatus) => {
      const t = tasks.find(x => x.id === id);
      if (!t) return;
      if (t.isCompleted || t.status === "done") {
        console.log("Task already completed; cannot move.");
        return;
      }
      await updateTask({ ...t, status, isCompleted: status === "done", completedAt: status === "done" ? new Date().toISOString() : undefined });
    },
    [tasks, updateTask]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      const t = tasks.find(x => x.id === taskId);
      setTasks(ts => ts.filter(x => x.id !== taskId));
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) console.error("deleteTask failed:", error);

      if (t?.goalId) {
        const progress = calculateGoalProgress(t.goalId);
        setGoals(gs =>
          gs.map(g => (g.id === t.goalId ? { ...g, tasks: g.tasks.filter(id => id !== taskId), progress } : g))
        );
        const { error: gErr } = await supabase.from("goals").update({ progress }).eq("id", t.goalId);
        if (gErr) console.error("Persist goal progress failed:", gErr);
      }
    },
    [tasks, calculateGoalProgress]
  );

  // ---- Goals ---------------------------------------------------

  const addGoal = useCallback(
    async (g: Omit<Goal, "id" | "progress" | "tasks">, initialTasks: Omit<Task, "id" | "createdAt" | "goalId">[] = []) => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("goals")
        .insert({
          user_id: userId,
          title: g.title,
          due_date: g.dueDate,
          timeframe: g.timeframe,
          specific: g.specific ?? null,
          measurable: g.measurable ?? null,
          achievable: g.achievable ?? null,
          relevant: g.relevant ?? null,
          time_bound: g.timeBound ?? null,
          progress: 0,
        })
        .select("*")
        .maybeSingle();

      if (error) {
        console.error("addGoal failed:", error);
        return null;
      }

      const goal: Goal = {
        id: data.id,
        title: data.title,
        dueDate: data.due_date,
        progress: data.progress ?? 0,
        timeframe: data.timeframe,
        tasks: [],
        specific: data.specific ?? undefined,
        measurable: data.measurable ?? undefined,
        achievable: data.achievable ?? undefined,
        relevant: data.relevant ?? undefined,
        timeBound: data.time_bound ?? undefined,
      };

      setGoals(gs => [...gs, goal]);

      // seed a default task if none were passed (keeps your UX)
      if (initialTasks.length === 0) {
        initialTasks = [
          {
            title: `Complete ${g.title}`,
            status: "open",
            isHighImpact: true,
            isCompleted: false,
            xpReward: 15,
          },
        ];
      }

      // create tasks for this goal
      for (const t of initialTasks) {
        await addTask({ ...t, goalId: goal.id });
      }

      return goal;
    },
    [userId, addTask]
  );

  const updateGoal = useCallback(
    async (updated: Goal) => {
      const progress = calculateGoalProgress(updated.id);
      const patch = {
        title: updated.title,
        due_date: updated.dueDate,
        timeframe: updated.timeframe,
        specific: updated.specific ?? null,
        measurable: updated.measurable ?? null,
        achievable: updated.achievable ?? null,
        relevant: updated.relevant ?? null,
        time_bound: updated.timeBound ?? null,
        progress,
      };

      const { error } = await supabase.from("goals").update(patch).eq("id", updated.id);
      if (error) {
        console.error("updateGoal failed:", error);
        return updated;
      }

      const updatedWithProgress: Goal = { ...updated, progress };
      setGoals(gs => gs.map(g => (g.id === updated.id ? updatedWithProgress : g)));

      // completion reward (if transitioned to 100)
      const prev = goals.find(g => g.id === updated.id);
      if (prev && prev.progress < 100 && progress === 100) {
        await bumpXP(50);
        setCompletedGoal(updatedWithProgress);
        setTimeout(() => setCompletedGoal(null), 5500);
      }

      return updatedWithProgress;
    },
    [goals, calculateGoalProgress, bumpXP]
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      // optimistic
      setGoals(gs => gs.filter(g => g.id !== id));
      setTasks(ts => ts.filter(t => t.goalId !== id));
      setPinnedGoalIds(ids => ids.filter(gid => gid !== id));

      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) console.error("deleteGoal failed:", error);
      // tasks are ON DELETE CASCADE in your schema, so they’ll follow
      await supabase.from("pinned_goals").delete().eq("goal_id", id);
    },
    []
  );

  const togglePinGoal = useCallback(
    async (id: string) => {
      if (!userId) return;
      const isPinned = pinnedGoalIds.includes(id);
      if (isPinned) {
        setPinnedGoalIds(ids => ids.filter(gid => gid !== id));
        const { error } = await supabase.from("pinned_goals").delete().eq("user_id", userId).eq("goal_id", id);
        if (error) console.error("unpin failed:", error);
      } else {
        // last 3 pins
        const next = [...pinnedGoalIds, id].slice(-3);
        setPinnedGoalIds(next);
        const { error } = await supabase
          .from("pinned_goals")
          .insert({ user_id: userId, goal_id: id });
        if (error) console.error("pin failed:", error);
      }
    },
    [userId, pinnedGoalIds]
  );

  // ---- Journal -------------------------------------------------

  const addJournalEntry = useCallback(
    async (e: Omit<JournalEntry, "id" | "xpEarned">) => {
      if (!userId) return null;
      const payload = {
        user_id: userId,
        content: e.content,
        accomplishments: e.accomplishments,
        blockers: e.blockers,
        gratitude: e.gratitude,
        value_served: e.valueServed,
        xp_earned: 10,
      };
      const { data, error } = await supabase.from("journal_entries").insert(payload).select("*").maybeSingle();
      if (error) {
        console.error("addJournalEntry failed:", error);
        return null;
      }
      const entry: JournalEntry = {
        id: data.id,
        date: data.created_at,
        content: data.content ?? "",
        accomplishments: data.accomplishments ?? "",
        blockers: data.blockers ?? "",
        gratitude: data.gratitude ?? "",
        valueServed: data.value_served ?? "",
        xpEarned: data.xp_earned ?? 10,
      };
      setJournalEntries(es => [entry, ...es]);
      await bumpXP(entry.xpEarned);
      return entry;
    },
    [userId, bumpXP]
  );

  // ---- Derived values -----------------------------------------

  const highImpactTasks = useMemo(
    () => tasks.filter(t => t.isHighImpact && !t.isCompleted),
    [tasks]
  );

  const tasksByStatus = useMemo(
    () => ({
      open: tasks.filter(t => t.status === "open"),
      inProgress: tasks.filter(t => t.status === "inProgress"),
      done: tasks.filter(t => t.status === "done"),
    }),
    [tasks]
  );

  // Pinned + not-completed for focus card (unchanged behavior)
  const focusGoals = useMemo(() => {
    return goals
      .filter(g => pinnedGoalIds.includes(g.id) && g.progress < 100)
      .map(g => {
        const goalTasks = tasks.filter(t => t.goalId === g.id);
        const earnedXP = goalTasks.reduce((sum, t) => t.status === "done" ? sum + (t.xpReward || 0) : sum, 0);
        return {
          ...g,
          progress: calcGoalProgress(goalTasks),
          completedTasks: goalTasks.filter(t => t.status === "done").length,
          totalTasks: goalTasks.length || 1,
          earnedXP,
        } as any;
      });
  }, [goals, pinnedGoalIds, tasks]);

  const nextLevelXp = useMemo(() => (userProfile.level + 1) * 100, [userProfile.level]);
  const xpProgress = useMemo(() => (userProfile.xp / nextLevelXp) * 100, [userProfile.xp, nextLevelXp]);

  return {
    // state
    loading,
    userProfile,
    goals,
    tasks,
    journalEntries,
    quote,
    completedGoal,
    pinnedGoalIds,

    // derived
    highImpactTasks,
    tasksByStatus,
    focusGoals,
    nextLevelXp,
    xpProgress,

    // actions
    updateVision,
    addTask,
    updateTask,
    moveTask,
    deleteTask,
    addGoal,
    updateGoal,
    deleteGoal,
    addJournalEntry,
    togglePinGoal,
    bumpXP,

    // misc
    refreshQuote: () => setQuote(getRandomQuote()),
    clearCompletedGoal: () => setCompletedGoal(null),
  };
});
