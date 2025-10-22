import { useState, useEffect } from "react";
import { Plus, Filter, Search, Calendar, List, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Goal, GoalStatus, GoalCategory, PriorityLevel } from "@shared/api";
import GoalCard from "@/components/GoalCard";
import CreateGoalModal from "@/components/CreateGoalModal";
import { useGoals } from "@/hooks/useGoals";

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<GoalStatus | "all">("all");
  const [filterCategory, setFilterCategory] = useState<GoalCategory | "all">("all");
  const [filterPriority, setFilterPriority] = useState<PriorityLevel | "all">("all");
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "progress" | "created">("dueDate");

  const { goals, addGoal, updateGoal, deleteGoal, stats } = useGoals();

  const filteredGoals = goals.filter((goal) => {
    const matchesSearch =
      goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || goal.status === filterStatus;
    const matchesCategory = filterCategory === "all" || goal.category === filterCategory;
    const matchesPriority = filterPriority === "all" || goal.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  const sortedGoals = [...filteredGoals].sort((a, b) => {
    if (sortBy === "dueDate") {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === "priority") {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (sortBy === "created") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  const statusCounts = {
    completed: goals.filter((g) => g.status === "completed").length,
    in_progress: goals.filter((g) => g.status === "in_progress").length,
    not_started: goals.filter((g) => g.status === "not_started").length,
    delayed: goals.filter((g) => g.status === "delayed").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Goals</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {goals.length} goals • {statusCounts.completed} completed
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              New Goal
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="p-6 rounded-lg border border-border/60 bg-card">
            <p className="text-sm text-muted-foreground mb-2">In Progress</p>
            <p className="text-3xl font-bold text-primary">{statusCounts.in_progress}</p>
          </div>
          <div className="p-6 rounded-lg border border-border/60 bg-card">
            <p className="text-sm text-muted-foreground mb-2">Not Started</p>
            <p className="text-3xl font-bold text-accent">{statusCounts.not_started}</p>
          </div>
          <div className="p-6 rounded-lg border border-border/60 bg-card">
            <p className="text-sm text-muted-foreground mb-2">Completed</p>
            <p className="text-3xl font-bold text-success">{statusCounts.completed}</p>
          </div>
          <div className="p-6 rounded-lg border border-border/60 bg-card">
            <p className="text-sm text-muted-foreground mb-2">Delayed</p>
            <p className="text-3xl font-bold text-destructive">{statusCounts.delayed}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg" className="gap-2">
                  <Filter className="h-5 w-5" />
                  Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("in_progress")}>
                  In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("not_started")}>
                  Not Started
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("completed")}>
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("delayed")}>
                  Delayed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg" className="gap-2">
                  <Filter className="h-5 w-5" />
                  Priority
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setFilterPriority("all")}>
                  All Priorities
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPriority("critical")}>
                  Critical
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPriority("high")}>
                  High
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPriority("medium")}>
                  Medium
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPriority("low")}>
                  Low
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg" className="gap-2">
                  <Filter className="h-5 w-5" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setSortBy("dueDate")}>
                  Due Date
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("priority")}>
                  Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("created")}>
                  Recently Created
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="lg"
                onClick={() => setViewMode("list")}
              >
                <List className="h-5 w-5" />
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "outline"}
                size="lg"
                onClick={() => setViewMode("calendar")}
              >
                <Calendar className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Goals List */}
        {viewMode === "list" && (
          <div className="space-y-4">
            {sortedGoals.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground mb-4">No goals found</p>
                <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                  <Plus className="h-5 w-5" />
                  Create Your First Goal
                </Button>
              </div>
            ) : (
              sortedGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onUpdate={updateGoal}
                  onDelete={deleteGoal}
                />
              ))
            )}
          </div>
        )}

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <div className="p-8 rounded-lg border border-border/60 bg-card text-center">
            <p className="text-muted-foreground">Calendar view coming soon</p>
          </div>
        )}
      </main>

      {/* Create Goal Modal */}
      <CreateGoalModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreate={addGoal}
      />
    </div>
  );
}
