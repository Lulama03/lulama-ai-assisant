import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateEmail } from "@/lib/ai.functions";
import type { Task } from "@/lib/tasks";

type Tone = "formal" | "friendly" | "concise" | "persuasive" | "apologetic";

export function EmailGenerator({ tasks }: { tasks: Task[] }) {
  const [taskId, setTaskId] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<Tone>("formal");
  const [intent, setIntent] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const emailFn = useServerFn(generateEmail);

  const generate = async () => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      toast.error("Pick a task first.");
      return;
    }
    if (!audience.trim()) {
      toast.error("Tell me who the email is for.");
      return;
    }
    setBusy(true);
    setDraft("");
    try {
      const text = await emailFn({
        data: { task, audience: audience.trim(), tone, intent: intent.trim() },
      });
      setDraft(text);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't write the draft.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Email details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Task</Label>
            <Select value={taskId} onValueChange={setTaskId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={tasks.length ? "Choose a task" : "Add a task first"}
                />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="audience">Audience</Label>
            <Input
              id="audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="My manager, the client, the design team…"
            />
          </div>
          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="persuasive">Persuasive</SelectItem>
                <SelectItem value="apologetic">Apologetic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="intent">Purpose (optional)</Label>
            <Input
              id="intent"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="Ask for a deadline extension"
            />
          </div>
          <Button onClick={generate} disabled={busy} className="w-full">
            {busy ? <Loader2 className="animate-spin" /> : <Mail />}
            Generate draft
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Draft</CardTitle>
          {draft && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(draft);
                toast.success("Copied to clipboard");
              }}
            >
              <Copy /> Copy
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {busy && <p className="text-sm text-muted-foreground">Writing your email…</p>}
          {!busy && !draft && (
            <p className="text-sm text-muted-foreground">
              Your generated email will appear here.
            </p>
          )}
          {draft && (
            <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 font-sans text-sm leading-relaxed">
              {draft}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
