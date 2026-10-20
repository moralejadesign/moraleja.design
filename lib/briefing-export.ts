import type {
  Briefing,
  BriefingAnswer,
  BriefingLink,
  BriefingQuestion,
  BriefingTopic,
  BudgetLanguage,
} from "@/db/schema";
import { SLIDER_STEPS, briefingHeading, isAnswered, isUploaded, topicLabel } from "./briefings";

export type BriefingExportData = Pick<
  Briefing,
  | "code"
  | "clientName"
  | "title"
  | "language"
  | "questions"
  | "answers"
  | "answerNotes"
  | "internalNotes"
  | "submittedAt"
>;

/** Words used in the exported Markdown and PDF, per language. */
export const EXPORT_LABELS: Record<
  BudgetLanguage,
  {
    client: string;
    code: string;
    sent: string;
    notSent: string;
    answered: (n: number, total: number) => string;
    noAnswer: string;
    note: string;
    internalNotes: string;
  }
> = {
  es: {
    client: "Cliente",
    code: "Código",
    sent: "Enviado",
    notSent: "Sin enviar",
    answered: (n, total) => `${n} de ${total} respondidas`,
    noAnswer: "Sin respuesta",
    note: "Nota",
    internalNotes: "Notas internas",
  },
  en: {
    client: "Client",
    code: "Code",
    sent: "Sent",
    notSent: "Not sent",
    answered: (n, total) => `${n} of ${total} answered`,
    noAnswer: "No answer",
    note: "Note",
    internalNotes: "Internal notes",
  },
};

/** Used as the file name, like budgets: moraleja_nudo_briefing */
export function briefingFileName(briefing: Pick<Briefing, "clientName">) {
  const slug = briefing.clientName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return `moraleja_${slug || "client"}_briefing`;
}

export function formatDate(value: Date | string) {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Consecutive questions of the same section, numbered in briefing order. */
export function groupQuestions(questions: BriefingQuestion[]) {
  const groups: { topic: BriefingTopic; items: { question: BriefingQuestion; number: number }[] }[] = [];
  questions.forEach((question, i) => {
    const last = groups.at(-1);
    if (last?.topic === question.topic) last.items.push({ question, number: i + 1 });
    else groups.push({ topic: question.topic, items: [{ question, number: i + 1 }] });
  });
  return groups;
}

/** "Clásica ○ ○ ○ ● ○ Moderna (4/5)" */
export function sliderText(question: BriefingQuestion, value: number) {
  const dots = Array.from({ length: SLIDER_STEPS }, (_, i) => (i + 1 === value ? "●" : "○")).join(" ");
  return `${question.minLabel} ${dots} ${question.maxLabel} (${value}/${SLIDER_STEPS})`;
}

const isUrl = (value: string) => /^https?:\/\//i.test(value.trim());

function linkLine(item: BriefingLink) {
  const { url, note } = item;
  // An uploaded file links its name; a pasted link shows the address and the note
  if (isUploaded(item)) return `- [${note || url}](${url})`;
  const link = url && isUrl(url) ? `[${url}](${url.trim()})` : url;
  return `- ${[link, note].filter(Boolean).join(" — ")}`;
}

function answerMarkdown(question: BriefingQuestion, answer: BriefingAnswer | undefined, noAnswer: string) {
  if (!isAnswered(answer)) return `_${noAnswer}_`;
  if (question.type === "slider" && typeof answer === "number") return sliderText(question, answer);
  if (question.type === "links" || question.type === "files") {
    return (answer as BriefingLink[]).map(linkLine).join("\n");
  }
  if (Array.isArray(answer)) return (answer as string[]).map((a) => `- ${a}`).join("\n");
  // Two trailing spaces keep the client's line breaks when the Markdown is rendered
  return String(answer).trim().replace(/\n/g, "  \n");
}

const quote = (text: string) =>
  text
    .trim()
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");

/** The whole briefing as Markdown, ready to paste into Claude, Notion or Figma. */
export function briefingToMarkdown(briefing: BriefingExportData, { includeNotes }: { includeNotes: boolean }) {
  const t = EXPORT_LABELS[briefing.language];
  const answered = briefing.questions.filter((q) => isAnswered(briefing.answers[q.id])).length;
  const lines: string[] = [
    `# ${briefingHeading(briefing)}`,
    "",
    `- **${t.client}:** ${briefing.clientName}`,
    `- **${t.code}:** ${briefing.code}`,
    briefing.submittedAt
      ? `- **${t.sent}:** ${formatDate(briefing.submittedAt)}`
      : `- **${t.notSent}:** ${t.answered(answered, briefing.questions.length)}`,
  ];

  for (const group of groupQuestions(briefing.questions)) {
    lines.push("", `## ${topicLabel(group.topic, briefing.language)}`);
    for (const { question, number } of group.items) {
      lines.push("", `### ${number}. ${question.title}`, "");
      lines.push(answerMarkdown(question, briefing.answers[question.id], t.noAnswer));
      const note = briefing.answerNotes[question.id]?.trim();
      if (includeNotes && note) lines.push("", quote(`**${t.note}:** ${note}`));
    }
  }

  if (includeNotes && briefing.internalNotes?.trim()) {
    lines.push("", `## ${t.internalNotes}`, "", briefing.internalNotes.trim());
  }

  return lines.join("\n") + "\n";
}

/** Readable answer for the admin list; null when unanswered. */
export function answerPlainText(question: BriefingQuestion, answer: BriefingAnswer | undefined) {
  if (!isAnswered(answer)) return null;
  if (question.type === "slider" && typeof answer === "number") return sliderText(question, answer);
  if (question.type === "links" || question.type === "files") {
    return (answer as BriefingLink[])
      .map((l) => (isUploaded(l) ? l.note || l.url : [l.url, l.note].filter(Boolean).join(" — ")))
      .join("\n");
  }
  if (Array.isArray(answer)) return (answer as string[]).join(", ");
  return String(answer).trim();
}
