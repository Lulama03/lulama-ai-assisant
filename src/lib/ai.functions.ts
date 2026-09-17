import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { z } from "zod";

import { createLovableResponsesProvider, requireLovableApiKey } from "./ai-gateway.server";

const MODEL = "openai/gpt-6-astra";

const providerOptions = {
  openai: {
    store: false,
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    include: ["reasoning.encrypted_content"],
  },
};

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  notes: z.string(),
  deadline: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  done: z.boolean(),
  createdAt: z.number(),
});

function taskLines(tasks: z.infer<typeof TaskSchema>[]) {
  if (!tasks.length) return "No tasks yet.";
  return tasks
    .map(
      (t) =>
        `- ${t.title} | deadline: ${t.deadline || "none"} | priority: ${t.priority} | ${
          t.done ? "completed" : "open"
        }${t.notes ? ` | notes: ${t.notes}` : ""}`,
    )
    .join("\n");
}

async function run(system: string, prompt: string) {
  const key = requireLovableApiKey();
  const lovable = createLovableResponsesProvider(key);
  const result = streamText({
    model: lovable.responses(MODEL),
    system,
    prompt,
    providerOptions,
  });
  const text = await result.text;
  return text?.trim() || "The assistant returned an empty response. Please try again.";
}

export const generatePlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        tasks: z.array(TaskSchema),
        horizon: z.enum(["day", "week"]),
        today: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    run(
      "You are a pragmatic workplace productivity planner. Produce a clear, structured plan in markdown-free plain text using short headings and bullet lines. Be specific about ordering and time blocks. Never invent tasks that were not given.",
      `Today is ${data.today}. Build a prioritized ${
        data.horizon === "day" ? "plan for today" : "plan for the coming week, grouped by day"
      } from these tasks (ignore completed ones except as context):\n${taskLines(
        data.tasks,
      )}\n\nInclude: ordered focus blocks with suggested durations, what to defer, and one risk to watch.`,
    ),
  );

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        task: TaskSchema,
        audience: z.string().min(1),
        tone: z.enum(["formal", "friendly", "concise", "persuasive", "apologetic"]),
        intent: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    run(
      "You write professional workplace emails. Output a subject line followed by the email body only. No commentary, no placeholders other than [Name] where truly needed.",
      `Write an email about this task:\n- Title: ${data.task.title}\n- Deadline: ${
        data.task.deadline || "none"
      }\n- Priority: ${data.task.priority}\n- Notes: ${data.task.notes || "none"}\n\nAudience: ${
        data.audience
      }\nTone: ${data.tone}\nPurpose: ${data.intent || "update the audience on this task"}`,
    ),
  );

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        tasks: z.array(TaskSchema),
        today: z.string(),
        messages: z.array(
          z.object({ role: z.enum(["user", "assistant"]), content: z.string() }),
        ),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const history = data.messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");
    return run(
      "You are a workplace productivity coach. Answer briefly and concretely, grounded in the user's task list. Plain text, short paragraphs or bullets. If the task list is empty, say so and suggest what to add.",
      `Today is ${data.today}.\nThe user's tasks:\n${taskLines(data.tasks)}\n\nConversation:\n${history}\n\nAssistant:`,
    );
  });
