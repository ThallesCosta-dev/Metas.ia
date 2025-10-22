import { useState } from "react";
import { Goal } from "@shared/api";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  goals: Goal[];
}

export default function CalendarView({ goals }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const getGoalsForDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = date.toISOString().split("T")[0];

    return goals.filter((goal) => {
      const dueDate = new Date(goal.dueDate).toISOString().split("T")[0];
      return dueDate === dateString;
    });
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

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

  const statusColor = {
    completed: "bg-success/20",
    in_progress: "bg-primary/20",
    not_started: "bg-accent/20",
    delayed: "bg-destructive/20",
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">{monthName}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-lg border border-border/60 bg-card p-4 overflow-x-auto">
        <div className="min-w-full">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const goalsForDay = day ? getGoalsForDate(day) : [];
              const isToday =
                day &&
                currentDate.toLocaleDateString() ===
                  new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toLocaleDateString();

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-24 p-2 rounded border transition-colors",
                    day ? "border-border/60 bg-background hover:bg-muted/30" : "border-transparent",
                    isToday && day && "bg-primary/10 border-primary"
                  )}
                >
                  {day && (
                    <div className="space-y-1">
                      <div className={cn("text-sm font-semibold", isToday && "text-primary")}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {goalsForDay.slice(0, 2).map((goal) => (
                          <div
                            key={goal.id}
                            className={cn(
                              "text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity",
                              statusColor[goal.status]
                            )}
                            title={goal.title}
                          >
                            <span className="mr-1">{categoryEmoji[goal.category]}</span>
                            {goal.title.substring(0, 12)}...
                          </div>
                        ))}
                        {goalsForDay.length > 2 && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{goalsForDay.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 rounded-lg border border-border/60 bg-card">
        <p className="text-sm font-semibold text-foreground mb-3">Legend</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-success/20" />
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-primary/20" />
            <span className="text-xs text-muted-foreground">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-accent/20" />
            <span className="text-xs text-muted-foreground">Not Started</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-destructive/20" />
            <span className="text-xs text-muted-foreground">Delayed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
