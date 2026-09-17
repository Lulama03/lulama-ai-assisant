import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { askAssistant } from "@/lib/ai.functions";
import type { Task } from "@/lib/tasks";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What should I focus on today?",
  "Which task is at risk of slipping?",
  "How do I break down my biggest task?",
];

export function AssistantChat({ tasks }: { tasks: Task[] }) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I can see your task list. Ask me what to focus on, how to sequence your day, or how to unblock something.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const askFn = useServerFn(askAssistant);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const reply = await askFn({
        data: {
          tasks,
          today: new Date().toISOString().slice(0, 10),
          messages: next.slice(-10),
        },
      });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The assistant is unavailable.");
      setMessages(next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mx-auto flex h-[70vh] w-full max-w-3xl flex-col overflow-hidden">
      <CardContent className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Thinking…
          </div>
        )}
        <div ref={endRef} />
      </CardContent>
      <div className="border-t border-border p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <Button key={s} variant="outline" size="sm" onClick={() => void send(s)}>
              {s}
            </Button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your workload…"
          />
          <Button type="submit" size="icon" disabled={busy} aria-label="Send">
            <Send />
          </Button>
        </form>
      </div>
    </Card>
  );
}
