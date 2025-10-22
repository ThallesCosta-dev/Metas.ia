import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { Goal } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface GoalCardProps {
  goal: Goal;
  onUpdate: (id: string, updates: Partial<Goal>) => void;
  onDelete: (id: string) => void;
}

export default function GoalCard({ goal, onUpdate, onDelete }: GoalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const daysUntilDue = Math.ceil(
    (new Date(goal.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const isOverdue = daysUntilDue < 0 && goal.status !== "completed";
  const isUrgent = daysUntilDue <= 7 && daysUntilDue >= 0;

  const statusColor = {
    completed: "text-success",
    in_progress: "text-primary",
    not_started: "text-accent",
    delayed: "text-destructive",
  };

  const statusBg = {
    completed: "bg-success/10",
    in_progress: "bg-primary/10",
    not_started: "bg-accent/10",
    delayed: "bg-destructive/10",
  };

  const priorityColor = {
    critical: "border-destructive text-destructive",
    high: "border-warning text-warning",
    medium: "border-primary text-primary",
    low: "border-muted-foreground text-muted-foreground",
  };

  const subgoalProgress =
    goal.subgoals.length > 0
      ? Math.round(
          (goal.subgoals.filter((s) => s.status === "completed").length /
            goal.subgoals.length) *
            100
        )
      : 0;

  const financialProgress =
    goal.type === "financial" && goal.financialDetails
      ? Math.round((goal.financialDetails.currentValue / goal.financialDetails.targetValue) * 100)
      : 0;

  const categoryEmoji = {
    health: "🏃",
    career: "💼",
    finances: "💰",
    personal: "✨",
    studies: "📚",
    hobbies: "🎨",
    relationships: "👥",
    other: "🎯",
  };

  return (
    <div className="border border-border/60 rounded-lg bg-card hover:shadow-md transition-all duration-200">
      {/* Card Header */}
      <div
        className="p-6 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <button
            className={cn(
              "mt-1 h-6 w-6 rounded border-2 flex items-center justify-center transition-all",
              goal.status === "completed"
                ? "bg-success border-success"
                : "border-border hover:border-primary"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(goal.id, {
                status: goal.status === "completed" ? "in_progress" : "completed",
                completedAt: goal.status === "completed" ? undefined : new Date().toISOString(),
              });
            }}
          >
            {goal.status === "completed" && <CheckCircle2 className="h-4 w-4 text-white" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{categoryEmoji[goal.category]}</div>
              <div className="flex-1">
                <h3
                  className={cn(
                    "font-semibold text-lg mb-1",
                    goal.status === "completed" && "line-through text-muted-foreground"
                  )}
                >
                  {goal.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
              </div>
            </div>

            {/* Tags and Info */}
            <div className="flex flex-wrap gap-2 mt-4 items-center">
              <div
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border",
                  statusBg[goal.status],
                  statusColor[goal.status]
                )}
              >
                {goal.status.replace("_", " ")}
              </div>

              <div
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border",
                  priorityColor[goal.priority]
                )}
              >
                {goal.priority}
              </div>

              {isOverdue && (
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Overdue
                </div>
              )}

              {!isOverdue && isUrgent && (
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Due soon
                </div>
              )}

              <div className="text-xs text-muted-foreground ml-auto">
                Due {new Date(goal.dueDate).toLocaleDateString()}
              </div>
            </div>

            {/* Progress Bar */}
            {(goal.subgoals.length > 0 || goal.type === "financial") && (
              <div className="mt-4 space-y-2">
                {goal.subgoals.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">Subgoals</span>
                      <span className="text-xs font-medium text-foreground">{subgoalProgress}%</span>
                    </div>
                    <Progress value={subgoalProgress} className="h-2" />
                  </div>
                )}

                {goal.type === "financial" && goal.financialDetails && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Financial Progress
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {goal.financialDetails.currency} {goal.financialDetails.currentValue} / {goal.financialDetails.targetValue}
                      </span>
                    </div>
                    <Progress value={Math.min(financialProgress, 100)} className="h-2" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(goal.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border/40 p-6 bg-muted/30 space-y-6">
          {/* Subgoals */}
          {goal.subgoals.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-3">Subgoals ({goal.subgoals.length})</h4>
              <div className="space-y-2">
                {goal.subgoals.map((subgoal) => (
                  <div
                    key={subgoal.id}
                    className="flex items-center gap-3 p-3 rounded border border-border/60 bg-background"
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded border-2 flex items-center justify-center transition-all",
                        subgoal.status === "completed"
                          ? "bg-success border-success"
                          : "border-border"
                      )}
                    >
                      {subgoal.status === "completed" && (
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          subgoal.status === "completed" && "line-through text-muted-foreground"
                        )}
                      >
                        {subgoal.title}
                      </p>
                      {subgoal.financialValue && (
                        <p className="text-xs text-muted-foreground">
                          ${subgoal.financialValue}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(subgoal.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Details */}
          {goal.type === "financial" && goal.financialDetails && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Financial Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded bg-background border border-border/60">
                  <p className="text-xs text-muted-foreground">Target Value</p>
                  <p className="text-lg font-bold text-foreground">
                    {goal.financialDetails.currency} {goal.financialDetails.targetValue.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded bg-background border border-border/60">
                  <p className="text-xs text-muted-foreground">Current Value</p>
                  <p className="text-lg font-bold text-primary">
                    {goal.financialDetails.currency} {goal.financialDetails.currentValue.toLocaleString()}
                  </p>
                </div>
              </div>

              {goal.financialDetails.savingsPerMonth && (
                <div className="p-3 rounded bg-accent/10 border border-accent/30">
                  <p className="text-xs text-muted-foreground">Recommended Monthly Savings</p>
                  <p className="text-lg font-bold text-accent">
                    {goal.financialDetails.currency} {goal.financialDetails.savingsPerMonth.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Timeline</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded bg-background border border-border/60">
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="font-medium">
                  {new Date(goal.startDate).toLocaleDateString()}
                </p>
              </div>
              <div className="p-3 rounded bg-background border border-border/60">
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className="font-medium">
                  {new Date(goal.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
