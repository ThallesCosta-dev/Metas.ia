import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  Plus,
  Trash2,
  CheckCircle2,
  DollarSign,
  Loader,
} from "lucide-react";
import { Goal, Subgoal } from "@shared/api";
import { useGoalsApi } from "@/hooks/useGoalsApi";
import { useSubgoalsApi } from "@/hooks/useSubgoalsApi";
import { useTransactionsApi } from "@/hooks/useTransactionsApi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getGoal, updateGoal } = useGoalsApi();
  const { getSubgoals, createSubgoal, updateSubgoal, deleteSubgoal } =
    useSubgoalsApi();
  const { getTransactions } = useTransactionsApi();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedGoal, setEditedGoal] = useState<Goal | null>(null);
  const [newSubgoal, setNewSubgoal] = useState({ title: "", dueDate: "" });
  const [loading, setLoading] = useState(true);

  // Load goal and subgoals
  useEffect(() => {
    const loadGoal = async () => {
      if (!id) {
        navigate("/dashboard");
        return;
      }

      const fetchedGoal = await getGoal(id);
      if (fetchedGoal) {
        setGoal(fetchedGoal);
        setEditedGoal(fetchedGoal);
      } else {
        toast.error("Goal not found");
        navigate("/dashboard");
      }
      setLoading(false);
    };

    loadGoal();
  }, [id, getGoal, navigate]);

  if (!goal || !editedGoal) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    return null;
  }

  const handleSave = async () => {
    const success = await updateGoal(goal.id, editedGoal);
    if (success) {
      setEditMode(false);
      toast.success("Goal updated successfully!");
      const fetchedGoal = await getGoal(goal.id);
      if (fetchedGoal) {
        setGoal(fetchedGoal);
        setEditedGoal(fetchedGoal);
      }
    } else {
      toast.error("Failed to update goal");
    }
  };

  const handleAddSubgoal = async () => {
    if (!newSubgoal.title || !newSubgoal.dueDate) return;

    const result = await createSubgoal(goal.id, {
      title: newSubgoal.title,
      due_date: newSubgoal.dueDate,
    });

    if (result) {
      setNewSubgoal({ title: "", dueDate: "" });
      toast.success("Subgoal created successfully!");
      const fetchedGoal = await getGoal(goal.id);
      if (fetchedGoal) {
        setGoal(fetchedGoal);
        setEditedGoal(fetchedGoal);
      }
    } else {
      toast.error("Failed to create subgoal");
    }
  };

  const handleDeleteSubgoal = async (subgoalId: string | number) => {
    const success = await deleteSubgoal(goal.id, subgoalId);
    if (success) {
      toast.success("Subgoal deleted successfully!");
      const fetchedGoal = await getGoal(goal.id);
      if (fetchedGoal) {
        setGoal(fetchedGoal);
        setEditedGoal(fetchedGoal);
      }
    } else {
      toast.error("Failed to delete subgoal");
    }
  };

  const handleToggleSubgoal = async (subgoalId: string | number) => {
    const subgoal = editedGoal.subgoals.find((s) => s.id === subgoalId);
    if (!subgoal) return;

    const newStatus =
      subgoal.status === "completed" ? "in_progress" : "completed";
    const success = await updateSubgoal(goal.id, subgoalId, {
      status: newStatus,
    });

    if (success) {
      const fetchedGoal = await getGoal(goal.id);
      if (fetchedGoal) {
        setGoal(fetchedGoal);
        setEditedGoal(fetchedGoal);
      }
    } else {
      toast.error("Failed to update subgoal");
    }
  };

  const subgoalProgress =
    editedGoal.subgoals.length > 0
      ? Math.round(
          (editedGoal.subgoals.filter((s) => s.status === "completed").length /
            editedGoal.subgoals.length) *
            100,
        )
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </>
            ) : (
              <Button onClick={() => setEditMode(true)}>Edit Goal</Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Goal Header */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="text-5xl">{categoryEmoji[editedGoal.category]}</div>
            <div className="flex-1">
              {editMode ? (
                <Input
                  value={editedGoal.title}
                  onChange={(e) =>
                    setEditedGoal({ ...editedGoal, title: e.target.value })
                  }
                  className="text-3xl font-bold mb-2"
                />
              ) : (
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  {editedGoal.title}
                </h1>
              )}

              <div className="flex flex-wrap gap-2 items-center">
                <div
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border",
                    editedGoal.status === "completed"
                      ? "bg-success/10 text-success border-success"
                      : editedGoal.status === "in_progress"
                        ? "bg-primary/10 text-primary border-primary"
                        : "bg-accent/10 text-accent border-accent",
                  )}
                >
                  {editedGoal.status.replace("_", " ")}
                </div>
                <div className="text-sm text-muted-foreground">
                  {editedGoal.category} • {editedGoal.priority} priority
                </div>
              </div>
            </div>
          </div>

          {editMode ? (
            <Textarea
              value={editedGoal.description}
              onChange={(e) =>
                setEditedGoal({ ...editedGoal, description: e.target.value })
              }
              className="text-base"
              rows={4}
            />
          ) : (
            <p className="text-lg text-muted-foreground">
              {editedGoal.description}
            </p>
          )}
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-2 gap-4 p-6 rounded-lg border border-border/60 bg-card">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Start Date</p>
            {editMode ? (
              <Input
                type="date"
                value={editedGoal.startDate}
                onChange={(e) =>
                  setEditedGoal({ ...editedGoal, startDate: e.target.value })
                }
              />
            ) : (
              <p className="text-lg font-semibold">
                {new Date(editedGoal.startDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Due Date</p>
            {editMode ? (
              <Input
                type="date"
                value={editedGoal.dueDate}
                onChange={(e) =>
                  setEditedGoal({ ...editedGoal, dueDate: e.target.value })
                }
              />
            ) : (
              <p className="text-lg font-semibold">
                {new Date(editedGoal.dueDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Financial Details */}
        {editedGoal.type === "financial" && editedGoal.financialDetails && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground">
              Financial Progress
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-lg border border-border/60 bg-card">
                <p className="text-sm text-muted-foreground mb-2">
                  Target Value
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {editedGoal.financialDetails.currency}{" "}
                  {editedGoal.financialDetails.targetValue.toLocaleString()}
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border/60 bg-card">
                <p className="text-sm text-muted-foreground mb-2">
                  Current Value
                </p>
                <p className="text-3xl font-bold text-primary">
                  {editedGoal.financialDetails.currency}{" "}
                  {editedGoal.financialDetails.currentValue.toLocaleString()}
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border/60 bg-card">
                <p className="text-sm text-muted-foreground mb-2">
                  Monthly Savings Target
                </p>
                <p className="text-3xl font-bold text-accent">
                  {editedGoal.financialDetails.currency}{" "}
                  {editedGoal.financialDetails.savingsPerMonth?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Update Financial Value */}
            {editMode && (
              <div className="p-4 rounded-lg border border-border/60 bg-muted/30 space-y-4">
                <h4 className="font-semibold">Update Current Value</h4>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amount to add"
                    className="flex-1"
                    id="contribution"
                  />
                  <Button
                    onClick={() => {
                      const input = document.getElementById(
                        "contribution",
                      ) as HTMLInputElement;
                      const amount = parseFloat(input.value);
                      if (amount > 0) {
                        setEditedGoal({
                          ...editedGoal,
                          financialDetails: {
                            ...editedGoal.financialDetails!,
                            currentValue:
                              editedGoal.financialDetails!.currentValue +
                              amount,
                            contributions: [
                              ...editedGoal.financialDetails!.contributions,
                              {
                                date: new Date().toISOString(),
                                amount,
                              },
                            ],
                          },
                        });
                        input.value = "";
                      }
                    }}
                  >
                    Add Contribution
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Subgoals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-foreground">
              Subgoals ({editedGoal.subgoals.length})
            </h3>
            {editMode && (
              <span className="text-sm text-muted-foreground">
                {subgoalProgress}% complete
              </span>
            )}
          </div>

          {editedGoal.subgoals.length > 0 && (
            <div className="space-y-2">
              {editedGoal.subgoals.map((subgoal) => (
                <div
                  key={subgoal.id}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border/60 bg-card hover:bg-muted/30 transition-colors"
                >
                  <button
                    onClick={() => handleToggleSubgoal(subgoal.id)}
                    className={cn(
                      "h-6 w-6 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                      subgoal.status === "completed"
                        ? "bg-success border-success"
                        : "border-border hover:border-primary",
                    )}
                  >
                    {subgoal.status === "completed" && (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-medium",
                        subgoal.status === "completed" &&
                          "line-through text-muted-foreground",
                      )}
                    >
                      {subgoal.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due: {new Date(subgoal.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  {editMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSubgoal(subgoal.id)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {editMode && (
            <div className="p-4 rounded-lg border border-border/60 bg-muted/30 space-y-4">
              <h4 className="font-semibold">Add Subgoal</h4>
              <div className="space-y-3">
                <Input
                  placeholder="Subgoal title"
                  value={newSubgoal.title}
                  onChange={(e) =>
                    setNewSubgoal({ ...newSubgoal, title: e.target.value })
                  }
                />
                <Input
                  type="date"
                  value={newSubgoal.dueDate}
                  onChange={(e) =>
                    setNewSubgoal({ ...newSubgoal, dueDate: e.target.value })
                  }
                />
                <Button onClick={handleAddSubgoal} className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add Subgoal
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
