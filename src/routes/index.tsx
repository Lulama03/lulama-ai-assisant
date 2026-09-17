import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ListTodo, Mail, MessagesSquare, Sparkles } from "lucide-react";

import { AssistantChat } from "@/components/AssistantChat";
import { EmailGenerator } from "@/components/EmailGenerator";
import { TaskPlanner } from "@/components/TaskPlanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTasks } from "@/hooks/use-tasks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlowDesk — AI Productivity Assistant for Work" },
      {
        name: "description",
        content:
          "Plan your day with AI, draft professional emails from your tasks, and ask an assistant what to focus on next.",
      },
      { property: "og:title", content: "FlowDesk — AI Productivity Assistant for Work" },
      {
        property: "og:description",
        content:
          "AI task planner, smart email generator, and a chat assistant that knows your workload.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { tasks, addTask, toggleTask, removeTask } = useTasks();
  const open = tasks.filter((t) => !t.done).length;
  const done = tasks.length - open;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-semibold">FlowDesk</h1>
              <p className="text-sm text-muted-foreground">
                Your AI-powered workplace productivity assistant
              </p>
            </div>
          </div>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <ListTodo className="size-4 text-primary" />
              <span className="font-medium">{open}</span>
              <span className="text-muted-foreground">open</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-success" />
              <span className="font-medium">{done}</span>
              <span className="text-muted-foreground">done</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <Tabs defaultValue="planner">
          <TabsList className="mb-6">
            <TabsTrigger value="planner">
              <ListTodo className="size-4" /> Planner
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="size-4" /> Email
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessagesSquare className="size-4" /> Assistant
            </TabsTrigger>
          </TabsList>

          <TabsContent value="planner">
            <TaskPlanner
              tasks={tasks}
              addTask={addTask}
              toggleTask={toggleTask}
              removeTask={removeTask}
            />
          </TabsContent>
          <TabsContent value="email">
            <EmailGenerator tasks={tasks} />
          </TabsContent>
          <TabsContent value="chat">
            <AssistantChat tasks={tasks} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
