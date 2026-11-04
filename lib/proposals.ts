import type {
  BudgetLanguage,
  Proposal,
  ProposalComment,
  ProposalDecision,
  ProposalReaction,
  ProposalSlide,
  ProposalStatus,
  ProposalVersion,
} from "@/db/schema";

export const PROPOSAL_STATUSES: { value: ProposalStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "in_review", label: "In review" },
  { value: "changes_requested", label: "Changes requested" },
  { value: "approved", label: "Approved" },
];

export const PROPOSAL_STATUS_STYLES: Record<ProposalStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-400",
  in_review: "bg-amber-500/10 text-amber-400",
  changes_requested: "bg-orange-500/10 text-orange-400",
  approved: "bg-green-500/10 text-green-400",
};

export const DEFAULT_INTRO: Record<BudgetLanguage, string> = {
  es: "Esta es la propuesta para tu marca. Recórrela con calma: haz clic sobre cualquier parte de una diapositiva para dejar un comentario justo ahí, o comenta la diapositiva completa. Cuando termines, cuéntanos si la apruebas o qué cambiarías.",
  en: "This is the proposal for your brand. Take your time: click anywhere on a slide to leave a comment right there, or comment on the whole slide. When you're done, tell us whether you approve it or what you'd change.",
};

export function proposalHeading(proposal: Pick<Proposal, "title" | "clientName">) {
  return proposal.title?.trim() || proposal.clientName.toUpperCase();
}

/** A proposal with every round and comment, as the admin API returns it. */
export type ProposalWithRounds = Proposal & {
  versions: ProposalVersion[];
  comments: ProposalComment[];
};

/** A row in the admin list, with counts for the round the client sees. */
export type ProposalListItem = Proposal & {
  rounds: number;
  currentRound: number | null;
  slides: number;
  comments: number;
  unresolved: number;
};

export const roundLabel = (number: number) => `R${number}`;

/** PDFs become one image per page; images are used as they are. */
export const PROPOSAL_UPLOAD_ACCEPT = ".pdf,image/png,image/jpeg,image/webp";
export const PROPOSAL_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const PROPOSAL_UPLOAD_MAX_MB = 40;
/** Long side of a rendered PDF page: sharp on retina screens, light enough to load fast. */
export const SLIDE_RENDER_MAX_PX = 3200;

export const isProposalUpload = (url: string) => url.includes(".blob.vercel-storage.com/proposals/");

// Limits for what reviewers can post
export const COMMENT_MAX_LENGTH = 2000;
export const AUTHOR_MAX_LENGTH = 80;
export const MAX_COMMENTS_PER_ROUND = 1000;
export const MAX_COMMENTS_PER_MINUTE = 12;

/** A comment as the viewer shows it; the author key never leaves the server. */
export type ViewerComment = {
  id: number;
  versionId: number;
  slideId: string;
  parentId: number | null;
  authorName: string;
  isAdmin: boolean;
  body: string;
  x: number | null;
  y: number | null;
  resolved: boolean;
  createdAt: string;
  mine: boolean;
};

export type ViewerRound = {
  id: number;
  number: number;
  note: string;
  slides: ProposalSlide[];
  reactions: Record<string, Record<string, ProposalReaction>>;
  decision: ProposalDecision | null;
  decisionNote: string;
  decidedBy: string;
  decidedAt: string | null;
};

export function toViewerComment(comment: ProposalComment, authorKey?: string | null): ViewerComment {
  return {
    id: comment.id,
    versionId: comment.versionId,
    slideId: comment.slideId,
    parentId: comment.parentId,
    authorName: comment.authorName,
    isAdmin: comment.isAdmin,
    body: comment.body,
    x: comment.x,
    y: comment.y,
    resolved: comment.resolvedAt !== null,
    createdAt: new Date(comment.createdAt ?? Date.now()).toISOString(),
    mine: comment.isAdmin ? !authorKey : !!authorKey && comment.authorKey === authorKey,
  };
}

export function toViewerRound(version: ProposalVersion): ViewerRound {
  return {
    id: version.id,
    number: version.number,
    note: version.note ?? "",
    slides: version.slides,
    reactions: version.reactions,
    decision: version.decision ?? null,
    decisionNote: version.decisionNote ?? "",
    decidedBy: version.decidedBy ?? "",
    decidedAt: version.decidedAt ? new Date(version.decidedAt).toISOString() : null,
  };
}

/** Pinned comments of a slide numbered in the order they were made, like the markers. */
export function pinNumbers(comments: ViewerComment[], slideId: string) {
  const numbers = new Map<number, number>();
  comments
    .filter((c) => c.slideId === slideId && c.parentId === null && c.x !== null)
    .sort((a, b) => a.id - b.id)
    .forEach((c, i) => numbers.set(c.id, i + 1));
  return numbers;
}

/** Used as the file name, like budgets: moraleja_nudo_proposal_r2 */
export function proposalFileName(proposal: Pick<Proposal, "clientName">, round?: number) {
  const slug = proposal.clientName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return `moraleja_${slug || "client"}_proposal${round ? `_r${round}` : ""}`;
}

/** Words used in the review screens and exports, per language. */
export const VIEWER_COPY = {
  es: {
    start: "Ver propuesta",
    round: "Ronda",
    whatChanged: "Qué cambió",
    slide: "Diapositiva",
    of: "de",
    comments: "Comentarios",
    noComments: "Aún no hay comentarios en esta diapositiva.",
    pinHint: "Haz clic sobre la diapositiva para comentar en un punto.",
    commentMode: "Comentar en un punto",
    cancel: "Cancelar",
    send: "Enviar",
    reply: "Responder",
    delete: "Eliminar",
    resolved: "Resuelto",
    resolve: "Resolver",
    reopen: "Reabrir",
    general: "Comentario sobre toda la diapositiva…",
    pinPlaceholder: "¿Qué opinas de esta parte?",
    replyPlaceholder: "Escribe una respuesta…",
    namePrompt: "¿Cómo te llamas?",
    nameHelp: "Tu nombre aparece junto a tus comentarios.",
    namePlaceholder: "Tu nombre",
    continue: "Continuar",
    like: "Me gusta",
    changes: "Necesita cambios",
    finish: "Terminar revisión",
    decisionTitle: "¿Cómo te parece esta ronda?",
    decisionHelp: "Tus comentarios ya están guardados. Esto nos dice cómo seguir.",
    approve: "Aprobar",
    requestChanges: "Pedir cambios",
    decisionNote: "Algo más que quieras agregar (opcional)",
    confirm: "Enviar decisión",
    approved: "Aprobada",
    changesRequested: "Cambios solicitados",
    decidedBy: (name: string, date: string) => `por ${name} · ${date}`,
    locked: "Esta ronda ya fue revisada. Los comentarios quedan como referencia.",
    pastRound: "Ronda anterior, solo lectura.",
    failed: "No se pudo guardar. Intenta de nuevo.",
    you: "tú",
    studio: "Moraleja",
    thanks: "¡Gracias! Recibimos tu revisión.",
  },
  en: {
    start: "View proposal",
    round: "Round",
    whatChanged: "What changed",
    slide: "Slide",
    of: "of",
    comments: "Comments",
    noComments: "No comments on this slide yet.",
    pinHint: "Click on the slide to comment on a spot.",
    commentMode: "Comment on a spot",
    cancel: "Cancel",
    send: "Send",
    reply: "Reply",
    delete: "Delete",
    resolved: "Resolved",
    resolve: "Resolve",
    reopen: "Reopen",
    general: "Comment on the whole slide…",
    pinPlaceholder: "What do you think of this part?",
    replyPlaceholder: "Write a reply…",
    namePrompt: "What's your name?",
    nameHelp: "Your name shows next to your comments.",
    namePlaceholder: "Your name",
    continue: "Continue",
    like: "Looks good",
    changes: "Needs changes",
    finish: "Finish review",
    decisionTitle: "How do you feel about this round?",
    decisionHelp: "Your comments are already saved. This tells us how to move forward.",
    approve: "Approve",
    requestChanges: "Request changes",
    decisionNote: "Anything else to add (optional)",
    confirm: "Send decision",
    approved: "Approved",
    changesRequested: "Changes requested",
    decidedBy: (name: string, date: string) => `by ${name} · ${date}`,
    locked: "This round was already reviewed. Comments stay for reference.",
    pastRound: "Earlier round, read-only.",
    failed: "Couldn't save. Please try again.",
    you: "you",
    studio: "Moraleja",
    thanks: "Thank you! We received your review.",
  },
} as const;

export type ViewerCopy = (typeof VIEWER_COPY)[BudgetLanguage];
