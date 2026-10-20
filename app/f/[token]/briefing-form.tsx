"use client";

/* eslint-disable @next/next/no-img-element -- static brand SVG */
import { useCallback, useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { ArrowDown, ArrowRight, ArrowUp, Check, FileText, Loader2, Plus, Upload, X } from "lucide-react";
import type { BriefingAnswer, BriefingLink, BriefingQuestion, BudgetLanguage } from "@/db/schema";
import {
  BRIEFING_UPLOAD_ACCEPT,
  BRIEFING_UPLOAD_MAX_MB,
  BRIEFING_UPLOAD_TYPES,
  SLIDER_STEPS,
  choiceOptions,
  isAnswered,
  isImageUrl,
  isUploaded,
  missingRequired,
  topicLabel,
} from "@/lib/briefings";
import { saveAnswers, submitBriefing } from "./actions";

const COPY = {
  es: {
    start: "Empezar",
    resume: "Continuar",
    questions: (n: number) => `${n} ${n === 1 ? "pregunta" : "preguntas"}`,
    minutes: (n: number) => `unos ${n} min`,
    ok: "OK",
    pressEnter: "o presiona Enter ↵",
    pressCmdEnter: "o presiona ⌘ + Enter",
    required: "Esta pregunta es obligatoria.",
    placeholder: "Escribe tu respuesta aquí…",
    chooseMany: "Elige todas las que apliquen.",
    url: "https://",
    note: "Nota (opcional)",
    fileUrl: "Enlace a Google Drive, Dropbox o WeTransfer",
    addLink: "Agregar otro",
    dropFiles: "Arrastra tus archivos aquí o haz clic para elegirlos",
    fileTypes: `Imágenes, PDF, AI, EPS o ZIP · hasta ${BRIEFING_UPLOAD_MAX_MB} MB cada uno`,
    uploading: "Subiendo…",
    tooBig: (name: string) => `${name} pesa más de ${BRIEFING_UPLOAD_MAX_MB} MB. Compártelo con un enlace.`,
    wrongType: (name: string) => `${name} no es un tipo de archivo permitido.`,
    uploadFailed: (name: string) => `No se pudo subir ${name}. Intenta de nuevo.`,
    shareLink: "¿Archivos muy pesados? Comparte un enlace",
    saving: "Guardando…",
    saved: "Guardado",
    saveFailed: "No se pudo guardar. Revisa tu conexión.",
    reviewTitle: "Revisa tus respuestas",
    reviewHint: "Toca una pregunta para cambiar tu respuesta.",
    unanswered: "Sin responder",
    requiredMissing: (n: number) =>
      n === 1 ? "Falta 1 pregunta obligatoria." : `Faltan ${n} preguntas obligatorias.`,
    submit: "Enviar briefing",
    backToReview: "Volver al resumen",
    thanksTitle: "¡Gracias!",
    thanks: "Recibimos tus respuestas. Las usaremos como punto de partida para tu marca.",
    alreadySent: "Este briefing ya fue enviado. Si necesitas cambiar algo, escríbenos a",
    submitFailed: "No se pudo enviar. Intenta de nuevo.",
    previous: "Anterior",
    next: "Siguiente",
  },
  en: {
    start: "Start",
    resume: "Continue",
    questions: (n: number) => `${n} ${n === 1 ? "question" : "questions"}`,
    minutes: (n: number) => `about ${n} min`,
    ok: "OK",
    pressEnter: "or press Enter ↵",
    pressCmdEnter: "or press ⌘ + Enter",
    required: "This question is required.",
    placeholder: "Type your answer here…",
    chooseMany: "Choose all that apply.",
    url: "https://",
    note: "Note (optional)",
    fileUrl: "Link to Google Drive, Dropbox or WeTransfer",
    addLink: "Add another",
    dropFiles: "Drag your files here or click to choose them",
    fileTypes: `Images, PDF, AI, EPS or ZIP · up to ${BRIEFING_UPLOAD_MAX_MB} MB each`,
    uploading: "Uploading…",
    tooBig: (name: string) => `${name} is over ${BRIEFING_UPLOAD_MAX_MB} MB. Share it with a link instead.`,
    wrongType: (name: string) => `${name} isn't an allowed file type.`,
    uploadFailed: (name: string) => `Couldn't upload ${name}. Please try again.`,
    shareLink: "Files too big? Share a link",
    saving: "Saving…",
    saved: "Saved",
    saveFailed: "Couldn't save. Check your connection.",
    reviewTitle: "Review your answers",
    reviewHint: "Tap a question to change your answer.",
    unanswered: "Not answered",
    requiredMissing: (n: number) =>
      n === 1 ? "1 required question is missing." : `${n} required questions are missing.`,
    submit: "Send briefing",
    backToReview: "Back to summary",
    thanksTitle: "Thank you!",
    thanks: "We got your answers. They'll be the starting point for your brand.",
    alreadySent: "This briefing has already been sent. If you need to change something, write to us at",
    submitFailed: "Couldn't send. Please try again.",
    previous: "Previous",
    next: "Next",
  },
} satisfies Record<BudgetLanguage, unknown>;

type Copy = (typeof COPY)[BudgetLanguage];
type Screen = "welcome" | number | "review" | "done";
type SaveState = "idle" | "saving" | "saved" | "error";

const CONTACT_EMAIL = "ale@moraleja.co";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function BriefingForm({
  token,
  heading,
  intro,
  language,
  questions,
  initialAnswers,
  submitted,
}: {
  token: string;
  heading: string;
  intro: string;
  language: BudgetLanguage;
  questions: BriefingQuestion[];
  initialAnswers: Record<string, BriefingAnswer>;
  submitted: boolean;
}) {
  const t = COPY[language];
  const [screen, setScreen] = useState<Screen>(submitted ? "done" : "welcome");
  const [answers, setAnswers] = useState(initialAnswers);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [showRequired, setShowRequired] = useState(false);
  const [fromReview, setFromReview] = useState(false);
  const [alreadySent, setAlreadySent] = useState(submitted);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const lastSaved = useRef(JSON.stringify(initialAnswers));
  const hasChanges = JSON.stringify(answers) !== lastSaved.current;

  const save = useCallback(
    async (data: Record<string, BriefingAnswer>) => {
      setSaveState("saving");
      const result = await saveAnswers(token, data);
      if (result.ok) {
        lastSaved.current = JSON.stringify(data);
        setSaveState("saved");
      } else if (result.error === "submitted") {
        setAlreadySent(true);
        setScreen("done");
      } else if (result.error === "unauthorized") {
        window.location.reload();
      } else {
        setSaveState("error");
      }
    },
    [token]
  );

  // Autosave shortly after the client stops typing
  useEffect(() => {
    if (!hasChanges || saveState === "saving") return;
    const timeout = setTimeout(() => save(answers), 800);
    return () => clearTimeout(timeout);
  }, [answers, hasChanges, saveState, save]);

  useEffect(() => {
    if (saveState !== "saved") return;
    const timeout = setTimeout(() => setSaveState("idle"), 2000);
    return () => clearTimeout(timeout);
  }, [saveState]);

  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  const setAnswer = (id: string, value: BriefingAnswer | undefined) =>
    setAnswers((prev) => {
      const next = { ...prev };
      if (value === undefined || !isAnswered(value)) delete next[id];
      else next[id] = value;
      return next;
    });

  const goTo = (target: Screen) => {
    setShowRequired(false);
    setScreen(target);
    window.scrollTo({ top: 0 });
  };

  // `answered` skips the check when the caller just set the answer (state not updated yet)
  const advance = (answered = false) => {
    if (typeof screen !== "number") return;
    const question = questions[screen];
    if (!answered && question.required && !isAnswered(answers[question.id])) {
      setShowRequired(true);
      return;
    }
    if (fromReview || screen === questions.length - 1) {
      setFromReview(false);
      goTo("review");
    } else {
      goTo(screen + 1);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(false);
    const result = await submitBriefing(token, answers);
    setSubmitting(false);
    if (result.ok || result.error === "submitted") {
      lastSaved.current = JSON.stringify(answers);
      setAlreadySent(!result.ok);
      goTo("done");
    } else if (result.error === "unauthorized") {
      window.location.reload();
    } else {
      setSubmitError(true);
    }
  };

  const firstUnanswered = questions.findIndex((q) => !isAnswered(answers[q.id]));
  const started = Object.keys(answers).length > 0;
  const progress =
    typeof screen === "number" ? (screen + 1) / questions.length : screen === "review" || screen === "done" ? 1 : 0;

  return (
    <div className="relative min-h-dvh flex flex-col">
      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur">
        <div className="h-[2px] bg-white/10">
          <div className="h-full bg-white transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="flex items-center justify-between px-4 sm:px-8 py-3">
          <img src="/budgets/studio-logo.svg" alt="Moraleja Studio" className="w-[38px]" />
          <span
            className={`text-[10px] uppercase tracking-[0.25em] ${saveState === "error" ? "text-red-400" : "text-white/40"}`}
            aria-live="polite"
          >
            {saveState === "saving" && t.saving}
            {saveState === "saved" && t.saved}
            {saveState === "error" && t.saveFailed}
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 pt-24 pb-28">
        <div className="w-full max-w-[680px] mx-auto">
          {screen === "welcome" && (
            <Welcome
              t={t}
              heading={heading}
              intro={intro}
              count={questions.length}
              started={started}
              onStart={() => goTo(started && firstUnanswered >= 0 ? firstUnanswered : started ? "review" : 0)}
            />
          )}

          {typeof screen === "number" && questions[screen] && (
            <QuestionScreen
              key={questions[screen].id}
              token={token}
              t={t}
              language={language}
              question={questions[screen]}
              index={screen}
              total={questions.length}
              answer={answers[questions[screen].id]}
              showRequired={showRequired}
              onChange={(value) => {
                setShowRequired(false);
                setAnswer(questions[screen].id, value);
              }}
              onNext={(answered) => advance(answered)}
              backToReview={fromReview}
            />
          )}

          {screen === "review" && (
            <Review
              t={t}
              language={language}
              questions={questions}
              answers={answers}
              submitting={submitting}
              submitError={submitError}
              onEdit={(index) => {
                setFromReview(true);
                goTo(index);
              }}
              onSubmit={submit}
            />
          )}

          {screen === "done" && <Done t={t} alreadySent={alreadySent} />}
        </div>
      </div>

      {/* Previous / next, like a deck */}
      {typeof screen === "number" && (
        <nav className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 flex">
          <button
            type="button"
            onClick={() => goTo(screen === 0 ? "welcome" : screen - 1)}
            className="p-3 bg-white text-black hover:bg-white/85 transition-colors border-r border-black/20"
            aria-label={t.previous}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => advance()}
            className="p-3 bg-white text-black hover:bg-white/85 transition-colors"
            aria-label={t.next}
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.25em] text-black hover:bg-white/85 transition-colors disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Welcome({
  t,
  heading,
  intro,
  count,
  started,
  onStart,
}: {
  t: Copy;
  heading: string;
  intro: string;
  count: number;
  started: boolean;
  onStart: () => void;
}) {
  // Roughly 30 seconds a question, rounded to 5 minutes
  const minutes = Math.max(5, Math.round((count * 0.5) / 5) * 5);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-[22px] sm:text-[30px] font-bold uppercase tracking-[0.3em] leading-snug">{heading}</h1>
      {intro && <p className="mt-6 whitespace-pre-line text-[15px] leading-relaxed text-white/70">{intro}</p>}
      <p className="mt-6 text-[11px] uppercase tracking-[0.25em] text-white/40">
        {t.questions(count)} · {t.minutes(minutes)}
      </p>
      <div className="mt-10">
        <PrimaryButton onClick={onStart}>
          {started ? t.resume : t.start}
          <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </div>
  );
}

function QuestionScreen({
  token,
  t,
  language,
  question,
  index,
  total,
  answer,
  showRequired,
  onChange,
  onNext,
  backToReview,
}: {
  token: string;
  t: Copy;
  language: BudgetLanguage;
  question: BriefingQuestion;
  index: number;
  total: number;
  answer: BriefingAnswer | undefined;
  showRequired: boolean;
  onChange: (value: BriefingAnswer | undefined) => void;
  onNext: (answered?: boolean) => void;
  backToReview: boolean;
}) {
  const options = choiceOptions(question);

  // Letter keys pick options; Enter continues (⌘ + Enter inside long text)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (e.key === "Enter" && !e.shiftKey) {
        if (target.tagName === "TEXTAREA" && !(e.metaKey || e.ctrlKey)) return;
        if (target.tagName === "BUTTON") return;
        e.preventDefault();
        onNext();
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (question.type === "single_choice" || question.type === "multiple_choice") {
        const i = LETTERS.indexOf(e.key.toUpperCase());
        if (i >= 0 && i < options.length) {
          e.preventDefault();
          pick(options[i]);
        }
      }
      if (question.type === "slider") {
        const n = Number(e.key);
        if (n >= 1 && n <= SLIDER_STEPS) onChange(n);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const pick = (option: string) => {
    if (question.type === "single_choice") {
      onChange(option);
      // Move on by itself after a short beat, like Typeform
      setTimeout(() => onNext(true), 350);
    } else {
      const current = Array.isArray(answer) ? (answer as string[]) : [];
      onChange(current.includes(option) ? current.filter((o) => o !== option) : [...current, option]);
    }
  };

  const help = question.help || (question.type === "multiple_choice" ? t.chooseMany : "");

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} · {topicLabel(question.topic, language)}
      </p>
      <h2 className="mt-4 text-[20px] sm:text-[26px] font-medium leading-snug">
        {question.title}
        {question.required && <span className="text-white/40"> *</span>}
      </h2>
      {help && <p className="mt-3 text-[14px] leading-relaxed text-white/50">{help}</p>}

      <div className="mt-8">
        {question.type === "short_text" && (
          <input
            type="text"
            value={typeof answer === "string" ? answer : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t.placeholder}
            autoFocus
            className="w-full bg-transparent border-b border-white/25 pb-2 text-[18px] sm:text-[22px] placeholder:text-white/20 focus:outline-none focus:border-white"
          />
        )}

        {question.type === "long_text" && (
          <AutoTextarea
            value={typeof answer === "string" ? answer : ""}
            onChange={(value) => onChange(value)}
            placeholder={t.placeholder}
          />
        )}

        {(question.type === "single_choice" || question.type === "multiple_choice") && (
          <div className="flex flex-col items-start gap-2">
            {options.map((option, i) => {
              const selected =
                question.type === "single_choice"
                  ? answer === option
                  : Array.isArray(answer) && (answer as string[]).includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => pick(option)}
                  className={`w-full sm:w-auto sm:min-w-[320px] flex items-center gap-3 border px-3 py-2.5 text-left text-[15px] transition-colors ${
                    selected ? "border-white bg-white text-black" : "border-white/25 hover:border-white/60"
                  }`}
                >
                  <span
                    className={`w-6 h-6 shrink-0 inline-flex items-center justify-center border text-[11px] ${
                      selected ? "border-black/40" : "border-white/30 text-white/60"
                    }`}
                  >
                    {selected && question.type === "multiple_choice" ? <Check className="h-3.5 w-3.5" /> : LETTERS[i]}
                  </span>
                  <span className="flex-1">{option}</span>
                </button>
              );
            })}
          </div>
        )}

        {question.type === "slider" && (
          <Slider
            value={typeof answer === "number" ? answer : null}
            minLabel={question.minLabel}
            maxLabel={question.maxLabel}
            onChange={onChange}
          />
        )}

        {question.type === "links" && (
          <LinksInput
            t={t}
            value={Array.isArray(answer) ? (answer as BriefingLink[]) : []}
            onChange={(links) => onChange(links)}
            urlPlaceholder={t.url}
          />
        )}

        {question.type === "files" && (
          <FilesInput
            t={t}
            token={token}
            value={Array.isArray(answer) ? (answer as BriefingLink[]) : []}
            onChange={(files) => onChange(files)}
          />
        )}
      </div>

      <p className="mt-4 min-h-[1.25em] text-[13px] text-red-400" role="alert">
        {showRequired && t.required}
      </p>

      <div className="mt-4 flex items-center gap-4">
        <PrimaryButton onClick={() => onNext()}>
          {backToReview ? t.backToReview : t.ok}
          <Check className="h-4 w-4" />
        </PrimaryButton>
        <span className="hidden sm:inline text-[11px] text-white/40">
          {question.type === "long_text" ? t.pressCmdEnter : t.pressEnter}
        </span>
      </div>
    </div>
  );
}

function AutoTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      autoFocus
      className="w-full resize-none overflow-hidden bg-transparent border-b border-white/25 pb-2 text-[17px] sm:text-[20px] leading-relaxed placeholder:text-white/20 focus:outline-none focus:border-white"
    />
  );
}

function Slider({
  value,
  minLabel,
  maxLabel,
  onChange,
}: {
  value: number | null;
  minLabel: string;
  maxLabel: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="max-w-[520px]">
      <div className="flex justify-between text-[12px] uppercase tracking-[0.2em]">
        <span className={value !== null && value < 3 ? "text-white" : "text-white/50"}>{minLabel}</span>
        <span className={value !== null && value > 3 ? "text-white" : "text-white/50"}>{maxLabel}</span>
      </div>
      <div className="relative mt-5 flex justify-between items-center">
        <span className="absolute inset-x-3 top-1/2 h-px bg-white/25" />
        {Array.from({ length: SLIDER_STEPS }, (_, i) => i + 1).map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onChange(step)}
            aria-label={String(step)}
            aria-pressed={value === step}
            className="relative p-1.5"
          >
            <span
              className={`block rounded-full border transition-all ${
                value === step
                  ? "w-6 h-6 bg-white border-white"
                  : "w-4 h-4 bg-[#0a0a0a] border-white/40 hover:border-white"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function LinksInput({
  t,
  value,
  onChange,
  urlPlaceholder,
}: {
  t: Copy;
  value: BriefingLink[];
  onChange: (links: BriefingLink[]) => void;
  urlPlaceholder: string;
}) {
  // Keep blank rows while typing; only filled ones are saved
  const [rows, setRows] = useState<BriefingLink[]>(value.length ? value : [{ url: "", note: "" }]);

  const update = (next: BriefingLink[]) => {
    setRows(next);
    onChange(next.filter((r) => r.url.trim() || r.note.trim()));
  };

  return (
    <div className="space-y-4">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="flex-1 grid sm:grid-cols-[1.2fr_1fr] gap-3">
            <input
              type="url"
              inputMode="url"
              value={row.url}
              onChange={(e) => update(rows.map((r, j) => (j === i ? { ...r, url: e.target.value } : r)))}
              placeholder={urlPlaceholder}
              autoFocus={i === rows.length - 1}
              className="w-full bg-transparent border-b border-white/25 pb-2 text-[16px] placeholder:text-white/20 focus:outline-none focus:border-white"
            />
            <input
              type="text"
              value={row.note}
              onChange={(e) => update(rows.map((r, j) => (j === i ? { ...r, note: e.target.value } : r)))}
              placeholder={t.note}
              className="w-full bg-transparent border-b border-white/25 pb-2 text-[16px] placeholder:text-white/20 focus:outline-none focus:border-white"
            />
          </div>
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => update(rows.filter((_, j) => j !== i))}
              className="p-1 text-white/40 hover:text-white"
              aria-label="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setRows([...rows, { url: "", note: "" }])}
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-white/60 hover:text-white"
      >
        <Plus className="h-3.5 w-3.5" />
        {t.addLink}
      </button>
    </div>
  );
}

function FilesInput({
  t,
  token,
  value,
  onChange,
}: {
  t: Copy;
  token: string;
  value: BriefingLink[];
  onChange: (items: BriefingLink[]) => void;
}) {
  // Local state so uploads finishing at different times never overwrite each other
  const [files, setFiles] = useState(() => value.filter(isUploaded));
  const [links, setLinks] = useState(() => value.filter((item) => !isUploaded(item)));
  const [uploading, setUploading] = useState<{ name: string; percent: number }[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [showLinks, setShowLinks] = useState(links.length > 0);
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const skipFirst = useRef(true);
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    onChangeRef.current([...files, ...links]);
  }, [files, links]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setErrors([]);
    for (const file of Array.from(list)) {
      if (file.size > BRIEFING_UPLOAD_MAX_MB * 1024 * 1024) {
        setErrors((prev) => [...prev, t.tooBig(file.name)]);
        continue;
      }
      const knownType = BRIEFING_UPLOAD_TYPES.includes(file.type) || /\.(ai|eps)$/i.test(file.name);
      if (!knownType) {
        setErrors((prev) => [...prev, t.wrongType(file.name)]);
        continue;
      }

      setUploading((prev) => [...prev, { name: file.name, percent: 0 }]);
      const safeName = file.name.normalize("NFD").replace(/[^a-zA-Z0-9._-]/g, "_");
      upload(`briefings/${safeName}`, file, {
        access: "public",
        handleUploadUrl: `/f/${token}/upload`,
        // .ai files often come without a type; send the one the server allows
        contentType: file.type || "application/postscript",
        onUploadProgress: ({ percentage }) =>
          setUploading((prev) => prev.map((u) => (u.name === file.name ? { ...u, percent: percentage } : u))),
      })
        .then((blob) => setFiles((prev) => [...prev, { url: blob.url, note: file.name }]))
        .catch(() => setErrors((prev) => [...prev, t.uploadFailed(file.name)]))
        .finally(() => setUploading((prev) => prev.filter((u) => u.name !== file.name)));
    }
  };

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`w-full flex flex-col items-center justify-center gap-3 border border-dashed px-4 py-10 text-center transition-colors ${
          dragging ? "border-white bg-white/[0.04]" : "border-white/30 hover:border-white/60"
        }`}
      >
        <Upload className="h-6 w-6 text-white/60" />
        <span className="text-[15px]">{t.dropFiles}</span>
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">{t.fileTypes}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={BRIEFING_UPLOAD_ACCEPT}
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {(files.length > 0 || uploading.length > 0) && (
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {files.map((file) => (
            <li key={file.url} className="relative group border border-white/15">
              {isImageUrl(file.url) ? (
                <img src={file.url} alt={file.note} className="aspect-square w-full object-cover" />
              ) : (
                <div className="aspect-square w-full flex flex-col items-center justify-center gap-2 p-2">
                  <FileText className="h-6 w-6 text-white/50" />
                </div>
              )}
              <p className="truncate px-2 py-1.5 text-[11px] text-white/60">{file.note}</p>
              <button
                type="button"
                onClick={() => setFiles((prev) => prev.filter((f) => f.url !== file.url))}
                className="absolute top-1.5 right-1.5 p-1 bg-black/70 text-white/80 hover:text-white"
                aria-label="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {uploading.map((u) => (
            <li key={u.name} className="border border-white/15">
              <div className="aspect-square w-full flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-white/60" />
                <span className="text-[11px] tabular-nums text-white/50">{Math.round(u.percent)}%</span>
              </div>
              <p className="truncate px-2 py-1.5 text-[11px] text-white/40">{u.name}</p>
            </li>
          ))}
        </ul>
      )}

      {errors.map((error) => (
        <p key={error} className="text-[13px] text-red-400">
          {error}
        </p>
      ))}

      {showLinks ? (
        <LinksInput t={t} value={links} onChange={setLinks} urlPlaceholder={t.fileUrl} />
      ) : (
        <button
          type="button"
          onClick={() => setShowLinks(true)}
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-white/60 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          {t.shareLink}
        </button>
      )}
    </div>
  );
}

/** One-line version of an answer for the summary screen. */
function summarize(question: BriefingQuestion, answer: BriefingAnswer | undefined) {
  if (!isAnswered(answer)) return null;
  if (question.type === "slider" && typeof answer === "number") {
    return `${question.minLabel} ${"·".repeat(answer - 1)}●${"·".repeat(SLIDER_STEPS - answer)} ${question.maxLabel}`;
  }
  if (Array.isArray(answer)) {
    return answer
      .map((a) =>
        typeof a === "string" ? a : isUploaded(a) ? a.note : [a.url, a.note].filter(Boolean).join(" — ")
      )
      .join(", ");
  }
  return String(answer);
}

function Review({
  t,
  language,
  questions,
  answers,
  submitting,
  submitError,
  onEdit,
  onSubmit,
}: {
  t: Copy;
  language: BudgetLanguage;
  questions: BriefingQuestion[];
  answers: Record<string, BriefingAnswer>;
  submitting: boolean;
  submitError: boolean;
  onEdit: (index: number) => void;
  onSubmit: () => void;
}) {
  const missing = missingRequired(questions, answers);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-[20px] sm:text-[26px] font-bold uppercase tracking-[0.25em]">{t.reviewTitle}</h2>
      <p className="mt-3 text-[14px] text-white/50">{t.reviewHint}</p>

      <ol className="mt-10 space-y-1">
        {questions.map((question, i) => {
          const summary = summarize(question, answers[question.id]);
          const isMissing = !summary && question.required;
          const startsTopic = i === 0 || questions[i - 1].topic !== question.topic;
          return (
            <li key={question.id}>
              {startsTopic && (
                <p className="pt-6 pb-2 text-[10px] uppercase tracking-[0.3em] text-white/40">
                  {topicLabel(question.topic, language)}
                </p>
              )}
              <button
                type="button"
                onClick={() => onEdit(i)}
                className="w-full text-left py-3 border-t border-white/10 hover:bg-white/[0.03] transition-colors"
              >
                <span className="flex gap-3 text-[14px]">
                  <span className="text-white/40 tabular-nums shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1">
                    {question.title}
                    {question.required && <span className="text-white/40"> *</span>}
                  </span>
                </span>
                <span
                  className={`mt-1 block pl-9 text-[13px] whitespace-pre-line line-clamp-3 ${
                    isMissing ? "text-red-400" : summary ? "text-white/60" : "text-white/25"
                  }`}
                >
                  {summary ?? (isMissing ? t.required : t.unanswered)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <PrimaryButton onClick={onSubmit} disabled={submitting || missing.length > 0}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {t.submit}
          {!submitting && <ArrowRight className="h-4 w-4" />}
        </PrimaryButton>
        {missing.length > 0 && <span className="text-[13px] text-red-400">{t.requiredMissing(missing.length)}</span>}
        {submitError && <span className="text-[13px] text-red-400">{t.submitFailed}</span>}
      </div>
    </div>
  );
}

function Done({ t, alreadySent }: { t: Copy; alreadySent: boolean }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center flex flex-col items-center">
      <img src="/budgets/studio-logo.svg" alt="" className="w-[88px]" />
      <h2 className="mt-10 text-[22px] sm:text-[28px] font-bold uppercase tracking-[0.3em]">{t.thanksTitle}</h2>
      <p className="mt-5 max-w-[440px] text-[15px] leading-relaxed text-white/70">
        {alreadySent ? (
          <>
            {t.alreadySent}{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:no-underline">
              {CONTACT_EMAIL}
            </a>
            .
          </>
        ) : (
          t.thanks
        )}
      </p>
    </div>
  );
}
