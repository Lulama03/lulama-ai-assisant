import { useCallback, useEffect, useState } from "react";

import type { Priority, Task } from "@/lib/tasks";

const KEY = "flowdesk.tasks.v1";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setTasks(JSON.parse(raw) as Task[]);
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(KEY, JSON.stringify(tasks));
  }, [tasks, loaded]);

  const addTask = useCallback(
    (input: { title: string; notes: string; deadline: string; priority: Priority }) => {
      setTasks((prev) => [
        {
          id: crypto.randomUUID(),
          title: input.title,
          notes: input.notes,
          deadline: input.deadline,
          priority: input.priority,
          done: false,
          createdAt: Date.now(),
        },
        ...prev,
      ]);
    },
    [],
  );

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, loaded, addTask, toggleTask, removeTask };
}
