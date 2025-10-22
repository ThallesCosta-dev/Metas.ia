/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

// Status types
export type GoalStatus = "not_started" | "in_progress" | "completed" | "delayed";
export type GoalType = "financial" | "non_financial";
export type PriorityLevel = "low" | "medium" | "high" | "critical";
export type Currency = "USD" | "BRL" | "EUR";

// Category/Tags
export type GoalCategory =
  | "health"
  | "career"
  | "finances"
  | "personal"
  | "studies"
  | "hobbies"
  | "relationships"
  | "other";

// Subgoal interface
export interface Subgoal {
  id: string;
  title: string;
  description?: string;
  status: GoalStatus;
  dueDate: string; // ISO date string
  financialValue?: number;
  dependencies?: string[]; // Array of subgoal IDs it depends on
  createdAt: string;
  updatedAt: string;
}

// Financial goal details
export interface FinancialGoalDetails {
  currency: Currency;
  targetValue: number;
  currentValue: number;
  contributions: Array<{
    date: string;
    amount: number;
    note?: string;
  }>;
  savingsPerDay?: number;
  savingsPerWeek?: number;
  savingsPerMonth?: number;
}

// Main Goal interface
export interface Goal {
  id: string;
  title: string;
  description: string;
  type: GoalType;
  status: GoalStatus;
  startDate: string; // ISO date string
  dueDate: string; // ISO date string
  category: GoalCategory;
  priority: PriorityLevel;

  // Financial details (only if type === 'financial')
  financialDetails?: FinancialGoalDetails;

  // Subgoals
  subgoals: Subgoal[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Dashboard stats
export interface GoalStats {
  totalGoals: number;
  completedGoals: number;
  inProgressGoals: number;
  delayedGoals: number;
  completionRate: number;
  avgDaysToComplete: number;
}

// Example response type for /api/demo
export interface DemoResponse {
  message: string;
}
