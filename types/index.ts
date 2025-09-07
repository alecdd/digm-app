export type TaskStatus = "open" | "inProgress" | "done";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  isHighImpact: boolean;
  isCompleted: boolean;
  goalId?: string;
  xpReward: number;
  createdAt: string;
  completedAt?: string;
}

export interface Goal {
  id: string;
  title: string;
  dueDate: string;
  progress: number;
  timeframe: "10year" | "5year" | "1year" | "3month" | "1month" | "1week";
  tasks: string[];
  specific?: string;
  measurable?: string;
  achievable?: string;
  relevant?: string;
  timeBound?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  accomplishments: string;
  blockers: string;
  gratitude: string;
  valueServed: string;
  xpEarned: number;
}

export interface UserProfile {
  vision: string;
  xp: number;
  level: number;
  streak: number;
  lastActive: string;
}

export interface LevelConfig {
  level: number;
  minXP: number;
  maxXP: number;
}

export interface Quote {
  quote: string;
  author: string;
}