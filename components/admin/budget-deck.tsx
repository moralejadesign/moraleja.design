"use client";

/* eslint-disable @next/next/no-img-element -- slides are scaled as a whole, like a printed page */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Budget, BudgetLanguage, BudgetSection } from "@/db/schema";
import { BUDGET_CONTACT, fillPlaceholders, formatBudgetDate } from "@/lib/budgets";
import { getBlobUrl } from "@/lib/config";

export type DeckBudget = Pick<
  Budget,
  "id" | "clientName" | "language" | "issueDate" | "sections" | "advancePercent" | "validDays" | "conditions"
>;

export type DeckProject = {
  slug: string;
  title: string;
  category: string;
  images: string[];
  fit: "cover" | "contain";
};

// Slides are laid out at this size and scaled to fit the screen
const WIDTH = 1920;
const HEIGHT = 1080;
const DAYS_PER_WEEK = 5;

const DECK_LABELS: Record<
  BudgetLanguage,
  {
    studio: string;
    proposal: string;
    process: string;
    phase: string;
    days: string;
    workingDays: string;
    weeks: string;
    week: string;
    afterBriefing: string;
    briefing: string;
    finalDelivery: string;
    revisions: string;
    timeline: string;
    deliverable: string;
    includes: string;
    duration: string;
    toBeDefined: string;
    conditions: string;
  }
> = {
  es: {
    studio: "MORALEJA STUDIO",
    proposal: "PROPUESTA DE TRABAJO",
    process: "EL PROCESO",
    phase: "FASE",
    days: "DÍAS",
    workingDays: "DÍAS HÁBILES",
    weeks: "SEMANAS",
    week: "SEMANA",
    afterBriefing: "A PARTIR DE LA ENTREGA DEL BRIEFING",
    briefing: "BRIEFING",
    finalDelivery: "ENTREGA FINAL",
    revisions: "RONDAS DE AJUSTES",
    timeline: "TIMELINE",
    deliverable: "ENTREGABLE",
    includes: "INCLUYE",
    duration: "DURACIÓN ESTIMADA",
    toBeDefined: "POR DEFINIR",
    conditions: "CONDICIONES GENERALES",
  },
  en: {
    studio: "MORALEJA STUDIO",
    proposal: "WORK PROPOSAL",
    process: "THE PROCESS",
    phase: "PHASE",
    days: "DAYS",
    workingDays: "WORKING DAYS",
    weeks: "WEEKS",
    week: "WEEK",
    afterBriefing: "STARTING FROM BRIEFING DELIVERY",
    briefing: "BRIEFING",
    finalDelivery: "FINAL DELIVERY",
    revisions: "REVISION ROUNDS",
    timeline: "TIMELINE",
    deliverable: "DELIVERABLE",
    includes: "INCLUDES",
    duration: "ESTIMATED DURATION",
    toBeDefined: "TO BE DEFINED",
    conditions: "GENERAL CONDITIONS",
  },
};

type Labels = (typeof DECK_LABELS)[BudgetLanguage];

/** "10 días" -> 10; null when the phase has no duration yet. */
function durationDays(section: BudgetSection) {
  const match = section.duration.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function BudgetDeck({ budget, projects }: { budget: DeckBudget; projects: DeckProject[] }) {
  const router = useRouter();
  const t = DECK_LABELS[budget.language];
  const fill = (text: string) => fillPlaceholders(text, budget);
  const sections = budget.sections.filter((s) => s.title || s.description);

  // These skip the page counter so it never sits on artwork
  const fullBleed = new Set(["cover", "title", "timeline", "closing", ...projects.map((p) => p.slug)]);
  const slides: React.ReactElement[] = [
    <CoverSlide key="cover" />,
    <TitleSlide key="title" budget={budget} t={t} />,
    ...projects.map((project, i) => (
      <ProjectSlide key={project.slug} project={project} index={i} total={projects.length} />
    )),
    <ProcessSlide key="process" sections={sections} fill={fill} t={t} />,
    ...sections.map((section, i) => (
      <PhaseSlide key={section.id} section={section} index={i} fill={fill} t={t} />
    )),
    <TimelineSlide key="timeline" sections={sections} fill={fill} t={t} />,
    <ClosingSlide key="closing" conditions={budget.conditions.filter((c) => c.trim())} fill={fill} t={t} />,
  ];

  const [current, setCurrent] = useState(0);
  const [scale, setScale] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (delta: number) => setCurrent((i) => Math.min(Math.max(i + delta, 0), slides.length - 1)),
    [slides.length]
  );

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        go(1);
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Home") {
        setCurrent(0);
      } else if (e.key === "End") {
        setCurrent(slides.length - 1);
      } else if (e.key === "f" || e.key === "F") {
        if (document.fullscreenElement) document.exitFullscreen();
        else rootRef.current?.requestFullscreen();
      } else if (e.key === "Escape" && !document.fullscreenElement) {
        router.push(`/admin/budgets/${budget.id}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, router, budget.id, slides.length]);

  return (
    <div
      ref={rootRef}
      // Covers the admin header; left third goes back, the rest forward
      onClick={(e) => go(e.clientX < window.innerWidth / 3 ? -1 : 1)}
      className="fixed inset-0 z-[100] flex cursor-pointer select-none items-center justify-center overflow-hidden bg-black font-sans text-white"
    >
      <div
        className="relative shrink-0 overflow-hidden bg-[#0a0a0a]"
        style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})` }}
      >
        {slides[current]}
        {!fullBleed.has(String(slides[current].key)) && (
          <span className="absolute bottom-[56px] right-[96px] bg-[#0a0a0a] px-3 py-1 text-[18px] tracking-[0.35em] text-white/40">
            {pad(current + 1)} / {pad(slides.length)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Shared pieces
 * ------------------------------------------------------------------------- */

function SlideHeader({ label }: { label?: string }) {
  return (
    <div className="absolute inset-x-[96px] top-[64px] flex items-start justify-between">
      <span className="text-[18px] font-bold tracking-[0.35em]">{label ?? BUDGET_CONTACT.site}</span>
      <img src="/budgets/studio-logo.svg" alt="Moraleja Studio" className="w-[75px]" />
    </div>
  );
}

function Chip({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={
        muted
          ? "inline-block border border-white/25 px-3 py-1.5 text-[18px] font-semibold uppercase leading-snug text-white/50"
          : "inline bg-white px-3 py-1 text-[18px] font-bold uppercase leading-[1.9] text-black [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
      }
    >
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------------------
 * Slides
 * ------------------------------------------------------------------------- */

function CoverSlide() {
  return <img src="/deck/cover.png" alt="Moraleja" className="absolute inset-0 h-full w-full object-cover" />;
}

function TitleSlide({ budget, t }: { budget: DeckBudget; t: Labels }) {
  return (
    <>
      <img
        src="/budgets/wave-header.svg"
        alt=""
        className="pointer-events-none absolute -left-[60px] -top-[120px] w-[2100px] max-w-none"
      />
      <div className="absolute inset-0 flex translate-y-[3%] flex-col items-center justify-center text-center">
        <p className="text-[22px] tracking-[0.6em] text-white/50">{t.proposal}</p>
        <h1 className="mt-10 text-[140px] font-bold uppercase leading-none tracking-[0.2em]">
          {budget.clientName}
        </h1>
        <p className="mt-10 text-[30px] font-medium tracking-[0.5em]">{t.studio}</p>
        <p className="mt-14 text-[18px] tracking-[0.6em] text-white/40">
          {formatBudgetDate(budget.issueDate).split("").join(" ")}
        </p>
      </div>
      <img
        src="/budgets/wave-corner.svg"
        alt=""
        className="pointer-events-none absolute -bottom-[720px] -right-[60px] w-[720px] max-w-none"
      />
    </>
  );
}

function ProjectSlide({ project, index, total }: { project: DeckProject; index: number; total: number }) {
  const [main, ...rest] = project.images.map(getBlobUrl);
  const fit = project.fit === "contain" ? "object-contain" : "object-cover";

  return (
    <div className="absolute inset-0 flex gap-6 p-6">
      <img src={main} alt={project.title} className={`h-full min-w-0 flex-[1.6] ${fit}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-col justify-between bg-[#0a0a0a] px-6 pb-4 pt-10" style={{ flex: rest.length ? "0 0 auto" : 1 }}>
          <span className="text-[18px] tracking-[0.35em] text-white/40">
            {pad(index + 1)} / {pad(total)}
          </span>
          <h2 className="mt-8 text-[60px] font-bold uppercase leading-[1.05] tracking-[0.08em]">{project.title}</h2>
          <p className="mt-6 text-[18px] uppercase tracking-[0.25em] text-white/50">{project.category}</p>
        </div>
        {rest.length > 0 && (
          <div
            className={`grid min-h-0 flex-1 gap-6 ${rest.length > 2 ? "grid-cols-2" : "grid-cols-1"}`}
            style={{ gridTemplateRows: `repeat(${rest.length > 2 ? Math.ceil(rest.length / 2) : rest.length}, minmax(0, 1fr))` }}
          >
            {rest.map((src) => (
              <div key={src} className="relative min-h-0">
                <img src={src} alt="" className={`absolute inset-0 h-full w-full ${fit}`} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProcessSlide({
  sections,
  fill,
  t,
}: {
  sections: BudgetSection[];
  fill: (text: string) => string;
  t: Labels;
}) {
  const days = sections.map(durationDays);
  const totalDays = days.reduce<number>((sum, d) => sum + (d ?? 0), 0);

  return (
    <>
      <SlideHeader />
      <div className="absolute inset-x-[96px] top-[240px]">
        <h2 className="text-[96px] font-bold uppercase tracking-[0.12em]">{t.process}</h2>
        {totalDays > 0 && (
          <p className="mt-6 text-[22px] tracking-[0.35em] text-white/50">
            {totalDays} {t.workingDays} · {Math.ceil(totalDays / DAYS_PER_WEEK)} {t.weeks}
          </p>
        )}
      </div>
      <ol
        className="absolute inset-x-[96px] top-[560px] grid gap-8"
        style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }}
      >
        {sections.map((section, i) => (
          <li key={section.id} className="relative border-t border-white/30 pt-8">
            <span className="absolute -top-[9px] left-0 h-[17px] w-[17px] rounded-full bg-white" />
            <span className="text-[18px] tracking-[0.35em] text-white/40">
              {t.phase} {pad(i + 1)}
            </span>
            <p className="mt-5 text-[30px] font-medium uppercase leading-[1.25] tracking-[0.12em]">
              {fill(section.title)}
            </p>
            <p className="mt-6">
              <Chip muted>{days[i] ? `${days[i]} ${t.days}` : t.toBeDefined}</Chip>
            </p>
          </li>
        ))}
      </ol>
    </>
  );
}

function PhaseSlide({
  section,
  index,
  fill,
  t,
}: {
  section: BudgetSection;
  index: number;
  fill: (text: string) => string;
  t: Labels;
}) {
  const bullets = section.bullets.filter(Boolean);

  return (
    <>
      <SlideHeader label={`${t.phase} ${pad(index + 1)}`} />
      <div className="absolute inset-x-[96px] bottom-[150px] top-[220px] grid grid-cols-[0.8fr_1.2fr] gap-[120px]">
        <div className="flex flex-col">
          <span className="text-[220px] font-bold leading-[0.85] text-white/10">{pad(index + 1)}</span>
          <h2 className="mt-10 text-[64px] font-bold uppercase leading-[1.1] tracking-[0.1em]">
            {fill(section.title)}
          </h2>
          <p className="mt-auto">
            <Chip muted>
              {t.duration}: {section.duration ? fill(section.duration) : t.toBeDefined}
            </Chip>
          </p>
        </div>

        <div className="flex flex-col border-l border-white/30 pl-[64px]">
          {section.description && (
            <p className="whitespace-pre-line text-[26px] leading-[1.6] text-white/65">{fill(section.description)}</p>
          )}
          {bullets.length > 0 && (
            <ul className="mt-10 space-y-5">
              {bullets.map((bullet, j) => (
                <li key={j} className="flex gap-4 text-[20px] font-semibold uppercase leading-[1.5]">
                  <span>+</span>
                  <span>{fill(bullet)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-auto space-y-4 pt-10">
            {section.deliverable && (
              <p>
                <Chip>
                  {t.deliverable}: {fill(section.deliverable)}
                </Chip>
              </p>
            )}
            {section.includes && (
              <p>
                <Chip>
                  {t.includes}: {fill(section.includes)}
                </Chip>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function TimelineSlide({
  sections,
  fill,
  t,
}: {
  sections: BudgetSection[];
  fill: (text: string) => string;
  t: Labels;
}) {
  // Phases run one after the other, in working days
  let start = 0;
  const bars = sections.map((section) => {
    const days = durationDays(section);
    const bar = { section, start, days };
    start += days ?? 0;
    return bar;
  });
  const totalDays = start;
  const weeks = Math.max(Math.ceil(totalDays / DAYS_PER_WEEK), 1);
  const span = weeks * DAYS_PER_WEEK;
  const pct = (days: number) => `${(days / span) * 100}%`;

  return (
    <>
      <SlideHeader />
      <div className="absolute inset-x-[96px] top-[200px]">
        <h2 className="text-[96px] font-bold uppercase tracking-[0.12em]">{t.timeline}</h2>
        <p className="mt-4 text-[20px] tracking-[0.35em] text-white/50">
          {totalDays} {t.workingDays} · {t.afterBriefing}
        </p>
      </div>

      <div className="absolute inset-x-[96px] bottom-[170px] top-[480px] grid grid-cols-[400px_1fr]">
        {/* Week ruler */}
        <div />
        <div className="relative grid border-b border-white/25 pb-4" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
          {Array.from({ length: weeks }, (_, w) => (
            <span key={w} className="text-[16px] tracking-[0.3em] text-white/45">
              {t.week} {w + 1}
            </span>
          ))}
        </div>

        {bars.map(({ section, start, days }, i) => (
          <div key={section.id} className="contents">
            <div className="flex flex-col justify-center border-b border-white/10 py-6 pr-8">
              <span className="text-[14px] tracking-[0.35em] text-white/40">
                {t.phase} {pad(i + 1)}
              </span>
              <span className="mt-2 text-[22px] font-medium uppercase tracking-[0.12em]">{fill(section.title)}</span>
            </div>
            <div className="relative border-b border-white/10">
              <WeekLines weeks={weeks} />
              {days ? (
                <div
                  className="absolute top-1/2 flex h-[56px] -translate-y-1/2 items-center justify-between bg-white px-5 text-black"
                  style={{ left: pct(start), width: pct(days) }}
                >
                  <span className="text-[16px] font-bold tracking-[0.2em]">
                    {days} {t.days}
                  </span>
                  {section.includes && <span className="h-[12px] w-[12px] rounded-full bg-black" title={fill(section.includes)} />}
                </div>
              ) : (
                <span className="absolute top-1/2 -translate-y-1/2 text-[16px] tracking-[0.3em] text-white/40" style={{ left: pct(start) }}>
                  {t.toBeDefined}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Milestones */}
        <div />
        <div className="relative whitespace-nowrap pt-5 text-[16px] tracking-[0.3em] text-white/60">
          <span className="absolute left-0">▲ {t.briefing}</span>
          {bars.some((b) => b.days && b.section.includes) && (
            <span className="absolute left-1/2 flex -translate-x-1/2 items-center gap-3">
              <span className="h-[12px] w-[12px] rounded-full bg-white" />
              {t.revisions}
            </span>
          )}
          {totalDays > 0 && (
            <span className="absolute -translate-x-full" style={{ left: pct(totalDays) }}>
              {t.finalDelivery} ▲
            </span>
          )}
        </div>
      </div>
    </>
  );
}

function WeekLines({ weeks }: { weeks: number }) {
  return (
    <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
      {Array.from({ length: weeks }, (_, w) => (
        <span key={w} className="border-l border-white/10" />
      ))}
    </div>
  );
}

function ClosingSlide({
  conditions,
  fill,
  t,
}: {
  conditions: string[];
  fill: (text: string) => string;
  t: Labels;
}) {
  return (
    <>
      <SlideHeader />
      <div className="absolute inset-x-[96px] top-[200px] grid grid-cols-[1fr_1fr] gap-[120px]">
        <div>
          <div className="space-y-6">
            <p className="text-[30px] tracking-[0.18em]">{BUDGET_CONTACT.email}</p>
            <p className="text-[30px] tracking-[0.18em]">{BUDGET_CONTACT.phone}</p>
            <p className="text-[30px] tracking-[0.18em]">{BUDGET_CONTACT.site}</p>
          </div>
          <p className="mt-[80px] text-[16px] font-medium tracking-[0.88em] text-white/70">{BUDGET_CONTACT.tagline}</p>
        </div>
        {conditions.length > 0 && (
          <div className="border-l border-white/30 pl-[64px]">
            <h3 className="text-[20px] font-medium tracking-[0.35em]">{t.conditions}</h3>
            <ul className="mt-10 space-y-6">
              {conditions.map((condition, i) => (
                <li key={i} className="flex gap-3 text-[18px] leading-[1.6] text-white/55">
                  <span>+</span>
                  <span>{fill(condition)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <img
        src="/budgets/wave-corner.svg"
        alt=""
        className="pointer-events-none absolute -bottom-[720px] -right-[60px] w-[720px] max-w-none"
      />
    </>
  );
}
