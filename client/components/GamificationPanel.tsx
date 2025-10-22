import { GameStats } from "@/hooks/useGamification";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, Star, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface GamificationPanelProps {
  stats: GameStats;
  compact?: boolean;
}

export default function GamificationPanel({ stats, compact = false }: GamificationPanelProps) {
  if (compact) {
    return (
      <div className="p-6 rounded-lg border border-border/60 bg-card space-y-4">
        <h3 className="font-semibold text-foreground mb-4">Your Progress</h3>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Level {stats.level}</span>
              <span className="text-sm font-medium text-foreground">{stats.totalPoints} pts</span>
            </div>
            <Progress 
              value={((stats.totalPoints % 500) / 500) * 100} 
              className="h-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded bg-background border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="h-4 w-4 text-warning" />
                <span className="text-xs text-muted-foreground">Streak</span>
              </div>
              <p className="text-lg font-bold">{stats.currentStreak}</p>
            </div>
            <div className="p-3 rounded bg-background border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-accent" />
                <span className="text-xs text-muted-foreground">Completed</span>
              </div>
              <p className="text-lg font-bold">{stats.totalCompleted}</p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/40">
          <p className="text-xs text-muted-foreground mb-2">Achievements</p>
          <div className="flex gap-2 flex-wrap">
            {stats.achievements.slice(0, 4).map((achievement) => (
              <div
                key={achievement.id}
                className={cn(
                  "relative h-8 w-8 rounded flex items-center justify-center text-lg",
                  achievement.unlocked ? "bg-primary/20" : "bg-muted"
                )}
                title={achievement.name}
              >
                {achievement.unlocked ? achievement.icon : "🔒"}
              </div>
            ))}
            {stats.achievements.length > 4 && (
              <div className="h-8 w-8 rounded flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground">
                +{stats.achievements.length - 4}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-lg border border-border/60 bg-card">
          <p className="text-sm text-muted-foreground mb-2">Level</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {stats.level}
          </p>
        </div>

        <div className="p-6 rounded-lg border border-border/60 bg-card">
          <p className="text-sm text-muted-foreground mb-2">Total Points</p>
          <p className="text-4xl font-bold text-primary">{stats.totalPoints}</p>
        </div>

        <div className="p-6 rounded-lg border border-border/60 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-4 w-4 text-warning" />
            <p className="text-sm text-muted-foreground">Current Streak</p>
          </div>
          <p className="text-4xl font-bold text-warning">{stats.currentStreak} days</p>
        </div>

        <div className="p-6 rounded-lg border border-border/60 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-accent" />
            <p className="text-sm text-muted-foreground">Longest Streak</p>
          </div>
          <p className="text-4xl font-bold text-accent">{stats.longestStreak} days</p>
        </div>
      </div>

      {/* Progress to Next Level */}
      <div className="p-6 rounded-lg border border-border/60 bg-card space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Level Progress</h3>
            <span className="text-sm text-muted-foreground">
              {stats.totalPoints % 500} / 500 points to next level
            </span>
          </div>
          <Progress value={((stats.totalPoints % 500) / 500) * 100} className="h-3" />
        </div>
      </div>

      {/* Achievements */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Achievements ({stats.achievements.filter((a) => a.unlocked).length}/{stats.achievements.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={cn(
                "p-4 rounded-lg border transition-all",
                achievement.unlocked
                  ? "border-primary/50 bg-primary/5 hover:bg-primary/10"
                  : "border-border/60 bg-muted/30 opacity-50"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{achievement.unlocked ? achievement.icon : "🔒"}</div>
                <div className="flex-1">
                  <h4 className={cn("font-semibold", !achievement.unlocked && "line-through")}>
                    {achievement.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  {achievement.unlocked && achievement.unlockedAt && (
                    <p className="text-xs text-success mt-2">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
