// hooks/useDigmStore.ts
import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Goal, JournalEntry, Task, TaskStatus, UserProfile } from "@/types";
import { getRandomQuote } from "@/constants/quotes";
import { getLevelInfo } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { ensureProfile } from "@/lib/supa-user";
import { create } from "zustand";
import { persist } from "zustand/middleware";


// ---- Helpers --------------------------------------------------

function calcGoalProgress(tasksForGoal: Task[]) {
  const total = tasksForGoal.length || 1;
  const done = tasksForGoal.filter((t) => t.status === "done").length;
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

const arraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

const initialProfile = (): UserProfile => ({
  vision: "",
  xp: 0,
  level: 1,
  streak: 0,
  lastActive: new Date().toISOString(),
});


// ---- Store implementation ------------------------------------

function useDigmStoreImpl() {
  console.log("[useDigmStore] Initializing store...");
  
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
  const [reloading, setReloading] = useState(false);
  const reloadAllInFlight = useRef(false);
  const fetchedUsers = useRef<Set<string>>(new Set());
  const initialLoadComplete = useRef(false);

  console.log("[useDigmStore] Store state initialized");


   /** Full in-memory reset (for sign-out) */
  const reset = useCallback(() => {
    setUserId(null);
    setUserProfile(initialProfile());
    setGoals([]);
    setTasks([]);
    setJournalEntries([]);
    setPinnedGoalIds([]);
    setQuote(getRandomQuote());
    setCompletedGoal(null);
    setLoading(false);
    setReloading(false);
    // Clear fetched users to allow fresh data loading for new users
    fetchedUsers.current.clear();
  }, []);

  /**
   * Reusable loader for ALL app data for a given user id.
   * Kept stable with an empty dependency array.
   */
  const fetchAll = useCallback(async (uid: string) => {
    if (!uid) {
      console.warn("[fetchAll] No user ID provided, skipping fetch");
      return;
    }
    
    try {
      console.log("[fetchAll] Starting fetch for user:", uid);
      
      // profiles
      {
        console.log("[fetchAll] Querying profiles table for user:", uid);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", uid)
          .maybeSingle();
        if (error) {
          console.error("[fetchAll] Profile query error:", error);
          // Don't throw, just log and continue
        } else if (data) {
          console.log("[fetchAll] Profile data found:", data);
          setUserProfile({
            vision: data.vision ?? "",
            xp: data.xp ?? 0,
            level: data.level ?? 1,
            streak: data.streak ?? 0,
            lastActive: data.last_active ?? new Date().toISOString(),
          });
          console.log("[fetchAll] profile loaded:", { vision: data.vision, xp: data.xp, level: data.level });
        } else {
          console.log("[fetchAll] No profile found for user:", uid);
          // First-login safety: create a minimal profile so the app can proceed
          try {
            const created = await ensureProfile({ defaults: { vision: "", onboarded: false } });
            console.log("[fetchAll] ensureProfile created:", created.profile);
            setUserProfile({
              vision: created.profile.vision ?? "",
              xp: 0,
              level: 1,
              streak: 0,
              lastActive: new Date().toISOString(),
            });
            // After creating a profile, mark this user as needing a second fetch to pick up derived tables
            fetchedUsers.current.delete(uid);
          } catch (e) {
            console.warn("[fetchAll] ensureProfile failed:", e);
          }
        }
        console.log("[fetchAll] profile ok");
      }

    // pinned goals
    {
      console.log("[fetchAll] Querying pinned_goals table for user:", uid);
      const { data, error } = await supabase
        .from("pinned_goals")
        .select("goal_id, pinned_at")
        .eq("user_id", uid)
        .order("pinned_at", { ascending: true });
      if (error) {
        console.error("[fetchAll] Pinned goals query error:", error);
        // Don't throw, just log and continue
      } else {
        console.log("[fetchAll] Pinned goals data:", data);
        const ids = (data ?? []).map((r: any) => r.goal_id as string);
        setPinnedGoalIds(prev => (arraysEqual(prev, ids) ? prev : ids));
        console.log("[fetchAll] pinned:", ids.length);
      }
    }

    // goals
    let mappedGoals: Goal[] = [];
    {
      console.log("[fetchAll] Querying goals table for user:", uid);
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("[fetchAll] Goals query error:", error);
        // Don't throw, just log and continue
      } else {
        console.log("[fetchAll] Goals data:", data);
        mappedGoals = (data ?? []).map((g: any) => ({
          id: g.id,
          title: g.title,
          dueDate: g.due_date,
          progress: g.progress ?? 0,
          timeframe: g.timeframe,
          tasks: [],
          specific: g.specific ?? undefined,
          measurable: g.measurable ?? undefined,
          achievable: g.achievable ?? undefined,
          relevant: g.relevant ?? undefined,
          timeBound: g.time_bound ?? undefined,
          completedAt: g.completed_at ?? undefined,
        }));
        setGoals(mappedGoals);
        console.log("[fetchAll] goals:", mappedGoals.length, mappedGoals.map(g => g.title));
      }
    }

    // journal entries
    {
      console.log("[fetchAll] Querying journal_entries table for user:", uid);
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("[fetchAll] Journal entries query error:", error);
      } else {
        const mapped: JournalEntry[] = (data ?? []).map((j: any) => ({
          id: j.id,
          date: j.created_at,
          content: j.content ?? "",
          accomplishments: j.accomplishments ?? "",
          blockers: j.blockers ?? "",
          gratitude: j.gratitude ?? "",
          valueServed: j.value_served ?? "",
          xpEarned: j.xp_earned ?? 10,
        }));
        setJournalEntries(mapped);
        console.log("[fetchAll] journal entries:", mapped.length);
      }
    }

    // tasks (then link into goals + recompute goal progress)
    {
      console.log("[fetchAll] Querying tasks table for user:", uid);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("[fetchAll] Tasks query error:", error);
        // Don't throw, just log and continue
      } else {
        console.log("[fetchAll] Tasks data:", data);
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
        setGoals((g) =>
          g.map((goal) => {
            const goalTasks = mapped.filter((t) => t.goalId === goal.id);
            const done = goalTasks.filter((t) => t.status === "done").length;
            const total = goalTasks.length || 1;
            return {
              ...goal,
              tasks: goalTasks.map((t) => t.id),
              progress: Math.round((done / total) * 100),
            };
          })
        );
        console.log("[fetchAll] tasks:", mapped.length, mapped.map(t => ({ title: t.title, status: t.status, goalId: t.goalId })));
      }
    }
    
    console.log("[fetchAll] Completed fetch for user:", uid);
  } catch (error) {
    console.error("[fetchAll] Unexpected error during data fetch:", error);
    // Don't throw here, just log the error and continue
    // This prevents the app from crashing if there's a database issue
  }
  }, []);

  /**
   * Initial load (auth + data)
   */
  useEffect(() => {
  (async () => {
      setLoading(true);
      try {
        console.log("[useDigmStore] Starting initial load...");
        // ✅ Do not create anon sessions here.
        // Only read whatever session exists (real user after login/confirm).
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.warn("Initial auth getUser failed:", error.message);
          setLoading(false);
          setQuote(getRandomQuote());
          return;
        }

        const user = data?.user ?? null;
        console.log("[useDigmStore] Auth getUser result:", { 
          hasUser: !!user, 
          userId: user?.id, 
          email: user?.email,
          isAnonymous: user?.app_metadata?.provider === 'anonymous'
        });
        
        if (!user) {
          // Not signed in yet (common on onboarding). Leave store empty.
          console.log("[useDigmStore] No user found, leaving store empty");
          setLoading(false);
          setQuote(getRandomQuote());
          return;
        }

        const uid = user.id;
        console.log("[useDigmStore] Setting userId and fetching data for:", uid);
        setUserId(uid);
        await new Promise((r) => setTimeout(r, 100));
        console.log("[useDigmStore] About to call fetchAll for user:", uid);
        try {
          console.log("[useDigmStore] fetchAll function exists:", !!fetchAll);
          await fetchAll(uid);
          console.log("[useDigmStore] fetchAll completed for user:", uid);
          initialLoadComplete.current = true;
        } catch (fetchError) {
          console.error("[useDigmStore] fetchAll failed during initial load:", fetchError);
        }
      } catch (e) {
        console.error("Initial load failed:", e);
      } finally {
        setLoading(false);
        setQuote(getRandomQuote());
      }
    })();
  }, []);

  /**
   * Public refresher you can call after onboarding/login
   * to make Home reflect the latest DB state.
   */
  const reloadAll = useCallback(async () => {
    // If userId is not set in store yet, try to get it from auth session
    let uid = userId;
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser();
      uid = user?.id ?? null;
      if (uid) {
        setUserId(uid); // Set userId if we found it
      }
    }
    
    if (!uid || reloadAllInFlight.current) return;
    
    // Wait for initial load to complete if it's still running
    if (loading && !reloading && !initialLoadComplete.current) {
      console.log("[reloadAll] Initial load still in progress, waiting...");
      return;
    }
    
    // If initial load is stuck, force it to complete
    if (loading && !reloading && initialLoadComplete.current === false) {
      console.log("[reloadAll] Initial load appears stuck, forcing completion");
      setLoading(false);
    }
      
    // Only prevent infinite loops if we've already fetched data for this user AND found some data
    // If we found no data, allow retries (user might be new or data might be loading)
    const hasData = goals.length > 0 || tasks.length > 0 || userProfile.vision !== "";
    if (fetchedUsers.current.has(uid) && hasData) {
      console.log("[reloadAll] Already fetched data for user:", uid, "- skipping");
      return;
    }

    // If we've already fetched for this user but found no data, allow one more attempt
    // This handles cases where the store was reset but the user still needs data
    if (fetchedUsers.current.has(uid) && !hasData) {
      console.log("[reloadAll] User marked as fetched but no data found, allowing retry for:", uid);
      fetchedUsers.current.delete(uid); // Remove from fetched users to allow retry
    }

    // Simple prevention: only skip if we're already loading
    if (loading) {
      console.log("[reloadAll] Already loading, skipping");
      return;
    }

    reloadAllInFlight.current = true;
    setReloading(true);
    setLoading(true);
    try {
      console.log("[reloadAll] About to call fetchAll for user:", uid);
      await fetchAll(uid);
      console.log("[reloadAll] fetchAll completed for user:", uid);
      // Mark this user as fetched to prevent future infinite loops
      fetchedUsers.current.add(uid);
    } catch (e) {
      console.error("reloadAll failed:", e);
      // Even if it fails, mark as fetched to prevent infinite retries
      fetchedUsers.current.add(uid);
    } finally {
      setLoading(false);
      setReloading(false);
      reloadAllInFlight.current = false;
    }
  }, [userId, fetchAll, loading, goals.length, tasks.length, userProfile.vision, reloading]);

  // Fallback: if initial load doesn't complete within 5 seconds, try to reload
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        if (loading && userId && !initialLoadComplete.current) {
          console.log("[useDigmStore] Initial load timeout, forcing reload for user:", userId);
          reloadAll();
        }
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [loading, userId, reloadAll]);

  // ---- Progress helpers ---------------------------------------

  const calculateGoalProgress = useCallback(
    (goalId: string) => calcGoalProgress(tasks.filter((t) => t.goalId === goalId)),
    [tasks]
  );

  // keep goal.progress in sync any time tasks change
  useEffect(() => {
    setGoals((gs) => gs.map((g) => ({ ...g, progress: calculateGoalProgress(g.id) })));
  }, [tasks, calculateGoalProgress]);

  // ---- Profile helpers (XP/Level, vision/streak) ---------------

  const bumpXP = useCallback(
    async (delta: number) => {
      setUserProfile((prev) => {
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
      setUserProfile((up) => ({ ...up, vision }));
      if (!userId) return;
      const { error } = await supabase.from("profiles").update({ vision }).eq("id", userId);
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
      const { data, error } = await supabase.from("tasks").insert(payload).select("*").maybeSingle();
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
      setTasks((ts) => [...ts, task]);
      if (task.goalId) {
        setGoals((gs) =>
          gs.map((g) =>
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
      const prev = tasks.find((t) => t.id === updated.id);
      const wasDoneBefore = !!(prev?.isCompleted || prev?.status === "done");
      if (wasDoneBefore) {
        console.log("Task already completed; ignoring changes.");
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
        completedAt: isNowDone ? updated.completedAt ?? new Date().toISOString() : undefined,
      };

      setTasks((ts) => ts.map((t) => (t.id === taskToUpdate.id ? taskToUpdate : t)));

      if (isNowDone && !wasDoneBefore) {
        const xpReward = updated.isHighImpact ? 15 : 5;
        await bumpXP(xpReward);
      }

      if (taskToUpdate.goalId) {
        const goalId = taskToUpdate.goalId;
        const progress = calculateGoalProgress(goalId);
        const now = new Date().toISOString();
        const goal = goals.find((g) => g.id === goalId);
        const justCompleted = !!(goal && goal.progress < 100 && progress === 100);

        // Persist goal progress (and completion timestamp if just completed)
        const updatePatch: any = { progress };
        if (justCompleted) updatePatch.completed_at = now;
        const { error: gErr } = await supabase.from("goals").update(updatePatch).eq("id", goalId);
        if (gErr) console.error("Persist goal progress failed:", gErr);

        // Update local state
        setGoals((gs) => gs.map((g) => (g.id === goalId ? { ...g, progress, completedAt: justCompleted ? now : g.completedAt } : g)));

        if (justCompleted) {
          // Unpin automatically if pinned
          setPinnedGoalIds((ids) => ids.filter((gid) => gid !== goalId));
          if (userId) {
            await supabase.from("pinned_goals").delete().eq("user_id", userId).eq("goal_id", goalId);
          }

          await bumpXP(50);
          setCompletedGoal({ ...goal!, progress: 100, completedAt: now });
          setTimeout(() => setCompletedGoal(null), 5500);
        }
      }
    },
    [tasks, calculateGoalProgress, goals, bumpXP, userId]
  );

  const moveTask = useCallback(
    async (id: string, status: TaskStatus) => {
      const t = tasks.find((x) => x.id === id);
      if (!t) return;
      if (t.isCompleted || t.status === "done") {
        console.log("Task already completed; cannot move.");
        return;
      }
      await updateTask({
        ...t,
        status,
        isCompleted: status === "done",
        completedAt: status === "done" ? new Date().toISOString() : undefined,
      });
    },
    [tasks, updateTask]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      const t = tasks.find((x) => x.id === taskId);
      setTasks((ts) => ts.filter((x) => x.id !== taskId));
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) console.error("deleteTask failed:", error);

      if (t?.goalId) {
        const progress = calculateGoalProgress(t.goalId);
        setGoals((gs) =>
          gs.map((g) =>
            g.id === t.goalId ? { ...g, tasks: g.tasks.filter((id) => id !== taskId), progress } : g
          )
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

      setGoals((gs) => [...gs, goal]);

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
      setGoals((gs) => gs.map((g) => (g.id === updated.id ? updatedWithProgress : g)));

      const prev = goals.find((g) => g.id === updated.id);
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
      setGoals((gs) => gs.filter((g) => g.id !== id));
      setTasks((ts) => ts.filter((t) => t.goalId !== id));
      setPinnedGoalIds((ids) => ids.filter((gid) => gid !== id));

      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) console.error("deleteGoal failed:", error);
      await supabase.from("pinned_goals").delete().eq("goal_id", id);
    },
    []
  );

  const togglePinGoal = useCallback(
    async (id: string) => {
      if (!userId) return;
      const isPinned = pinnedGoalIds.includes(id);

      if (isPinned) {
        setPinnedGoalIds((ids) => ids.filter((gid) => gid !== id));
        const { error } = await supabase
          .from("pinned_goals")
          .delete()
          .eq("user_id", userId)
          .eq("goal_id", id);
        if (error) console.error("unpin failed:", error);
      } else {
         const next = [...pinnedGoalIds, id].slice(-3);
        setPinnedGoalIds((prev) => (arraysEqual(prev, next) ? prev : next));
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
      setJournalEntries((es) => [entry, ...es]);
      await bumpXP(entry.xpEarned);
      return entry;
    },
    [userId, bumpXP]
  );

  const updateJournalEntry = useCallback(
    async (
      id: string,
      patch: Partial<Pick<JournalEntry, "content" | "accomplishments" | "blockers" | "gratitude" | "valueServed">>
    ) => {
      // Optimistic local update
      setJournalEntries((es) =>
        es.map((e) => (e.id === id ? { ...e, ...patch } : e))
      );

      const dbPatch: any = {
        ...(patch.content !== undefined ? { content: patch.content } : {}),
        ...(patch.accomplishments !== undefined ? { accomplishments: patch.accomplishments } : {}),
        ...(patch.blockers !== undefined ? { blockers: patch.blockers } : {}),
        ...(patch.gratitude !== undefined ? { gratitude: patch.gratitude } : {}),
        ...(patch.valueServed !== undefined ? { value_served: patch.valueServed } : {}),
      };
      const { error } = await supabase
        .from("journal_entries")
        .update(dbPatch)
        .eq("id", id);
      if (error) {
        console.error("updateJournalEntry failed:", error);
      }
    },
    []
  );

  const deleteJournalEntry = useCallback(
    async (id: string) => {
      setJournalEntries((es) => es.filter((e) => e.id !== id));
      const { error } = await supabase.from("journal_entries").delete().eq("id", id);
      if (error) console.error("deleteJournalEntry failed:", error);
    },
    []
  );

  // ---- Derived values -----------------------------------------

  const highImpactTasks = useMemo(() => tasks.filter((t) => t.isHighImpact && !t.isCompleted), [tasks]);

  const tasksByStatus = useMemo(
    () => ({
      open: tasks.filter((t) => t.status === "open"),
      inProgress: tasks.filter((t) => t.status === "inProgress"),
      done: tasks.filter((t) => t.status === "done"),
    }),
    [tasks]
  );

  const focusGoals = useMemo(() => {
    if (!goals.length || !pinnedGoalIds.length) return [];
    return goals
      .filter((g) => pinnedGoalIds.includes(g.id) && g.progress < 100)
      .map((g) => {
        const goalTasks = tasks.filter((t) => t.goalId === g.id);
        const earnedXP = goalTasks.reduce(
          (sum, t) => (t.status === "done" ? sum + (t.xpReward || 0) : sum),
          0
        );
        return {
          ...g,
          progress: calcGoalProgress(goalTasks),
          completedTasks: goalTasks.filter((t) => t.status === "done").length,
          totalTasks: goalTasks.length || 1,
          earnedXP,
        };
      });
  }, [goals, pinnedGoalIds, tasks]);

  const nextLevelXp = useMemo(() => (userProfile.level + 1) * 100, [userProfile.level]);
  const xpProgress = useMemo(() => (userProfile.xp / nextLevelXp) * 100, [userProfile.xp, nextLevelXp]);

  return {
    // state
    loading,
    userId,
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
    updateJournalEntry,
    deleteJournalEntry,
    togglePinGoal,
    bumpXP,
    // misc
    reloadAll,
    refreshQuote: () => setQuote(getRandomQuote()),
    clearCompletedGoal: () => setCompletedGoal(null),
    reset,
  };
}

export const [DigmProvider, useDigmStore] =
  createContextHook(useDigmStoreImpl);


