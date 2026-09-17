import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generatePlan } from "@/lib/ai.functions";
import type { Priority, Task } from "@/lib/tasks";

const priorityStyles: Record<Priority, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/15 text-warning-foreground border-warning/30",
  low: "bg-success/10 text-success border-success/20",
};

export function TaskPlanner({
  tasks,
  addTask,
  toggleTask,
  removeTask,
}: {
  tasks: Task[];
  addTask: (t: { title: string; notes: string; deadline: string; priority: Priority }) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [plan, setPlan] = useState("");
  const [busy, setBusy] = useState<"day" | "week" | null>(null);
  const planFn = useServerFn(generatePlan);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({ title: title.trim(), notes: notes.trim(), deadline, priority });
    setTitle("");
    setNotes("");
    setDeadline("");
    setPriority("medium");
  };

  const makePlan = async (horizon: "day" | "week") => {
    if (tasks.length === 0) {
      toast.error("Add a task first.");
      return;
    }
    setBusy(horizon);
    setPlan("");
    try {
      const text = await planFn({
        data: { tasks, horizon, today: new Date().toISOString().slice(0, 10) },
      });
      setPlan(text);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't build the plan.");
    } finally {
      setBusy(null);
    }
  };

  const open = tasks.filter((t) => !t.done);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add a task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Draft Q3 budget summary"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Context (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Who's involved, what's blocking it…"
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full">
                <Plus /> Add task
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">
              Your tasks <span className="text-muted-foreground">({open.length} open)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing here yet — add your first task above.
              </p>
            )}
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
              >
                <Checkbox
                  checked={task.done}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-medium ${task.done ? "text-muted-foreground line-through" : ""}`}
                  >
                    {task.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className={priorityStyles[task.priority]}>
                      {task.priority}
                    </Badge>
                    {task.deadline && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3" /> {task.deadline}
                      </span>
                    )}
                  </div>
                  {task.notes && (
                    <p className="mt-1 text-xs text-muted-foreground">{task.notes}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${task.title}`}
                  onClick={() => removeTask(task.id)}
                >
                  <Trash2 className="text-muted-foreground" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-lg">AI plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => makePlan("day")} disabled={busy !== null} className="flex-1">
              {busy === "day" ? <Loader2 className="animate-spin" /> : <Sparkles />}
              Plan my day
            </Button>
            <Button
              variant="secondary"
              onClick={() => makePlan("week")}
              disabled={busy !== null}
              className="flex-1"
            >
              {busy === "week" ? <Loader2 className="animate-spin" /> : <CalendarDays />}
              Plan my week
            </Button>
          </div>
          {busy && (
            <p className="text-sm text-muted-foreground">Thinking through your priorities…</p>
          )}
          {plan ? (
            <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 font-sans text-sm leading-relaxed">
              {plan}
            </pre>
          ) : (
            !busy && (
              <p className="text-sm text-muted-foreground">
                Generate a prioritized schedule from your task list.
              </p>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
