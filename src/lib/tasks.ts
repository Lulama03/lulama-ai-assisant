export type Priority = "high" | "medium" | "low";

export type Task = {
  id: string;
  title: string;
  notes: string;
  deadline: string; // yyyy-mm-dd
  priority: Priority;
  done: boolean;
  createdAt: number;
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function describeTasks(tasks: Task[]) {
  if (tasks.length === 0) return "The user has no tasks yet.";
  return tasks
    .map(
      (t) =>
        `- ${t.title} | deadline: ${t.deadline || "none"} | priority: ${t.priority} | status: ${
          t.done ? "completed" : "open"
        }${t.notes ? ` | notes: ${t.notes}` : ""}`,
    )
    .join("\n");
}
