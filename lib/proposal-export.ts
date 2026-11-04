import type { BudgetLanguage, ProposalReaction } from "@/db/schema";
import { pinNumbers, proposalHeading, roundLabel, type ViewerComment, type ViewerRound } from "./proposals";
import { formatDate } from "./briefing-export";

export type FeedbackExportData = {
  code: string;
  clientName: string;
  title: string | null;
  language: BudgetLanguage;
  round: ViewerRound;
  comments: ViewerComment[];
};

export const FEEDBACK_LABELS: Record<
  BudgetLanguage,
  {
    feedback: string;
    client: string;
    code: string;
    round: string;
    decision: string;
    approved: string;
    changesRequested: string;
    pending: string;
    slide: string;
    general: string;
    resolved: string;
    noComments: string;
    reactions: Record<ProposalReaction, string>;
  }
> = {
  es: {
    feedback: "Comentarios",
    client: "Cliente",
    code: "Código",
    round: "Ronda",
    decision: "Decisión",
    approved: "Aprobada",
    changesRequested: "Cambios solicitados",
    pending: "Pendiente",
    slide: "Diapositiva",
    general: "General",
    resolved: "resuelto",
    noComments: "Sin comentarios",
    reactions: { like: "Le gusta", changes: "Necesita cambios" },
  },
  en: {
    feedback: "Feedback",
    client: "Client",
    code: "Code",
    round: "Round",
    decision: "Decision",
    approved: "Approved",
    changesRequested: "Changes requested",
    pending: "Pending",
    slide: "Slide",
    general: "General",
    resolved: "resolved",
    noComments: "No comments",
    reactions: { like: "Looks good", changes: "Needs changes" },
  },
};

export type SlideFeedback = {
  index: number;
  slide: ViewerRound["slides"][number];
  reactions: Record<ProposalReaction, string[]>;
  threads: { comment: ViewerComment; number: number | null; replies: ViewerComment[] }[];
};

/** Feedback grouped by slide, in slide order; pinned threads first, numbered like the markers. */
export function feedbackBySlide(data: FeedbackExportData, { onlyOpen = false } = {}): SlideFeedback[] {
  return data.round.slides.map((slide, index) => {
    const pins = pinNumbers(data.comments, slide.id);
    const threads = data.comments
      .filter((c) => c.slideId === slide.id && c.parentId === null && (!onlyOpen || !c.resolved))
      .sort((a, b) => (pins.get(a.id) ?? Infinity) - (pins.get(b.id) ?? Infinity) || a.id - b.id)
      .map((comment) => ({
        comment,
        number: pins.get(comment.id) ?? null,
        replies: data.comments.filter((c) => c.parentId === comment.id),
      }));
    const own = data.round.reactions[slide.id] ?? {};
    const reactions = { like: [] as string[], changes: [] as string[] };
    Object.entries(own).forEach(([name, r]) => reactions[r]?.push(name));
    return { index, slide, reactions, threads };
  });
}

export function decisionText(round: ViewerRound, language: BudgetLanguage) {
  const t = FEEDBACK_LABELS[language];
  if (!round.decision) return t.pending;
  const label = round.decision === "approved" ? t.approved : t.changesRequested;
  return `${label} · ${round.decidedBy}${round.decidedAt ? ` · ${formatDate(round.decidedAt)}` : ""}`;
}

const quote = (text: string) => text.trim().replace(/\n/g, "\n  ");

/** Markdown for notes, tasks or the next round's brief. */
export function feedbackToMarkdown(data: FeedbackExportData, options: { onlyOpen?: boolean } = {}) {
  const t = FEEDBACK_LABELS[data.language];
  const lines = [
    `# ${proposalHeading(data)} · ${t.feedback} ${roundLabel(data.round.number)}`,
    "",
    `- **${t.client}:** ${data.clientName}`,
    `- **${t.code}:** ${data.code}`,
    `- **${t.round}:** ${data.round.number}`,
    `- **${t.decision}:** ${decisionText(data.round, data.language)}`,
  ];
  if (data.round.decisionNote) lines.push("", `> ${quote(data.round.decisionNote).replace(/\n {2}/g, "\n> ")}`);

  for (const item of feedbackBySlide(data, options)) {
    const reactionLines = (Object.keys(item.reactions) as ProposalReaction[])
      .filter((r) => item.reactions[r].length)
      .map((r) => `_${t.reactions[r]}: ${item.reactions[r].join(", ")}_`);
    if (!item.threads.length && !reactionLines.length) continue;

    lines.push("", `## ${t.slide} ${item.index + 1}${item.slide.title ? ` · ${item.slide.title}` : ""}`, "");
    lines.push(...reactionLines.map((l) => `${l}  `));
    if (reactionLines.length && item.threads.length) lines.push("");
    for (const { comment, number, replies } of item.threads) {
      const marker = number ? `**#${number}**` : `**${t.general}**`;
      const resolved = comment.resolved ? ` _(${t.resolved})_` : "";
      lines.push(`- ${marker} ${comment.authorName}: ${quote(comment.body)}${resolved}`);
      for (const reply of replies) lines.push(`  - ${reply.authorName}: ${quote(reply.body).replace(/\n {2}/g, "\n    ")}`);
    }
  }
  return lines.join("\n") + "\n";
}
