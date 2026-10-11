import type {
  Budget,
  BudgetCurrency,
  BudgetKind,
  BudgetLanguage,
  BudgetPhaseContent,
  BudgetSection,
  BudgetStatus,
} from "@/db/schema";

export const BUDGET_CONTACT = {
  site: "MORALEJA.CO",
  email: "ALE@MORALEJA.CO",
  phone: "+57 319 351 4654",
  tagline: "BRAVE BRANDS CHANGE THE WORLD",
};

export const BUDGET_STATUSES: { value: BudgetStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

/** Words printed on the document, per language. */
export const BUDGET_LABELS: Record<
  BudgetLanguage,
  {
    budget: string;
    phase: string;
    investment: string;
    deliverable: string;
    includes: string;
    duration: string;
    conditions: string;
    perMonth: string;
    advance: string;
    balance: string;
    validUntil: string;
  }
> = {
  es: {
    budget: "BUDGET",
    phase: "FASE",
    investment: "INVERSIÓN",
    deliverable: "ENTREGABLE",
    includes: "INCLUYE",
    duration: "DURACIÓN ESTIMADA",
    conditions: "CONDICIONES GENERALES",
    perMonth: "/MES",
    advance: "ANTICIPO",
    balance: "SALDO",
    validUntil: "VÁLIDO HASTA",
  },
  en: {
    budget: "BUDGET",
    phase: "PHASE",
    investment: "TOTAL INVESTMENT",
    deliverable: "DELIVERABLE",
    includes: "INCLUDES",
    duration: "ESTIMATED DURATION",
    conditions: "GENERAL CONDITIONS",
    perMonth: "/MONTH",
    advance: "ADVANCE",
    balance: "BALANCE",
    validUntil: "VALID UNTIL",
  },
};

/**
 * Default conditions. Placeholders are filled when the document renders:
 * {client}, {advance} (percent) and {validDays}.
 */
export const DEFAULT_CONDITIONS: Record<BudgetKind, Record<BudgetLanguage, string[]>> = {
  project: {
    es: [
      "La duración estimada del proyecto depende de la entrega del briefing inicial, que permitirá definir con claridad la dirección de comunicación. Una vez entregado el briefing se definirá el tiempo de ejecución de cada pieza, sujeto a extensiones por razones de logística u otros imprevistos que deberán ser comunicados con anticipación por ambas partes.",
      "Cada fase incluye hasta 2 rondas de ajustes. Las revisiones adicionales se cotizan por separado y se acuerdan antes de ejecutarse.",
      "Para dar inicio al proyecto se requiere un anticipo mínimo del {advance}% del valor total acordado. Los entregables finales serán enviados una vez completado el pago del saldo restante.",
      "Cotización válida por {validDays} días calendario a partir de la fecha de envío.",
    ],
    en: [
      "A minimum advance of {advance}% is required to initiate the project, with final deliverables released upon receipt of the full remaining balance.",
      "Each phase includes up to 2 rounds of revisions; additional rounds are quoted and approved in writing before execution.",
      "Any addition or modification to the original scope constitutes a change order and will not be executed without written approval.",
      "The client is responsible for delivering all required materials within agreed timeframes, as delays on the client side may impact the overall timeline.",
      "All creative work remains the property of Moraleja Co. until full payment is received, at which point ownership transfers to the client, including source files.",
      "Both parties agree to maintain confidentiality over the contents of this proposal and all project materials; Moraleja reserves the right to feature completed work in its portfolio unless otherwise agreed in writing.",
      "In the event of cancellation, payments made for completed phases are non-refundable and work in progress will be billed proportionally.",
      "This proposal is valid for {validDays} calendar days from the date of issue.",
    ],
  },
  retainer: {
    es: [
      "La duración estimada de cada pieza depende de la entrega del briefing, que permitirá definir con claridad la dirección de comunicación. Una vez entregado el briefing se definirá el tiempo de ejecución, sujeto a extensiones por razones de logística u otros imprevistos que deberán ser comunicados con anticipación por ambas partes.",
      "Los assets gráficos o piezas digitales incluyen hasta dos rondas de ajustes. Si se requiere una ronda adicional, se puede acordar con un costo adicional que dependerá de la complejidad de los ajustes solicitados y del timing del proyecto.",
      "Para dar inicio al servicio se requiere un anticipo mínimo del {advance}% del valor acordado. Los entregables finales serán enviados una vez completado el pago del saldo restante.",
      "Cotización válida por {validDays} días calendario a partir de la fecha de envío.",
    ],
    en: [
      "Turnaround for each piece depends on receiving the brief, which defines the communication direction. Once the brief is delivered, execution time is agreed, subject to extensions for logistics or other unforeseen events communicated in advance by either party.",
      "Graphic assets and digital pieces include up to two rounds of revisions. Additional rounds can be agreed at an extra cost depending on their complexity and the project timing.",
      "A minimum advance of {advance}% of the agreed fee is required to start the service. Final deliverables are released upon payment of the remaining balance.",
      "This proposal is valid for {validDays} calendar days from the date of issue.",
    ],
  },
};

export function newSectionId() {
  return Math.random().toString(36).slice(2, 10);
}

export function emptySection(): BudgetSection {
  return {
    id: newSectionId(),
    title: "",
    description: "",
    bullets: [],
    deliverable: "",
    includes: "",
    duration: "",
    price: null,
  };
}

export function sectionFromPhase(content: BudgetPhaseContent, price: number | null): BudgetSection {
  return { ...content, bullets: [...content.bullets], id: newSectionId(), price };
}

export function sumSectionPrices(sections: BudgetSection[]): number | null {
  const priced = sections.filter((s) => s.price !== null && !Number.isNaN(s.price));
  if (priced.length === 0) return null;
  return priced.reduce((sum, s) => sum + (s.price ?? 0), 0);
}

/** The manual total wins; otherwise the sum of section prices. */
export function budgetTotal(budget: Pick<Budget, "total" | "sections">): number | null {
  if (budget.total !== null && budget.total !== "") return Number(budget.total);
  return sumSectionPrices(budget.sections);
}

export function formatMoney(amount: number, currency: BudgetCurrency) {
  const locale = currency === "COP" ? "es-CO" : "en-US";
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${currency} ${formatted}`;
}

/** "2026-09-15" -> "15/09/2026" */
export function formatBudgetDate(isoDate: string) {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

export function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function fillPlaceholders(
  text: string,
  budget: Pick<Budget, "clientName" | "advancePercent" | "validDays">
) {
  return text
    .replaceAll("{client}", budget.clientName || "…")
    .replaceAll("{advance}", String(budget.advancePercent))
    .replaceAll("{validDays}", String(budget.validDays));
}

export function budgetHeading(budget: Pick<Budget, "title" | "clientName" | "language">) {
  return budget.title?.trim() || `${budget.clientName} ${BUDGET_LABELS[budget.language].budget}`;
}

/** Used as the PDF filename, matching the existing files: moraleja_nudo_budget */
export function budgetFileName(budget: Pick<Budget, "clientName">) {
  const slug = budget.clientName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return `moraleja_${slug || "client"}_budget`;
}

/** Starter library, taken from the 2026 budgets. Text uses {client} for the client's name. */
export const STARTER_PHASES: {
  name: string;
  content: Record<BudgetLanguage, BudgetPhaseContent>;
}[] = [
  {
    name: "Brand diagnosis & strategy",
    content: {
      es: {
        title: "Diagnóstico y estrategia de marca",
        description:
          "Análisis del estado actual de la marca y definición de los fundamentos estratégicos que guiarán todas las decisiones de diseño. Esta fase establece el punto de partida documentando las bases conceptuales para la creación de la identidad visual.",
        bullets: [
          "Definición de atributos de marca y territorio visual",
          "Moodboards con referencias visuales alineadas al posicionamiento",
        ],
        deliverable: "Documento de estrategia visual + moodboards aprobados",
        includes: "",
        duration: "5 días",
      },
      en: {
        title: "Brand diagnosis & strategy",
        description:
          "Analysis of the brand's current state and definition of the strategic foundations that will guide every design decision. This phase establishes the conceptual baseline for the visual identity, ensuring every creative direction is grounded in positioning, not preference.",
        bullets: [
          "Brand attribute definition and visual territory mapping",
          "Moodboards aligned to the brand's strategic positioning",
        ],
        deliverable: "Visual strategy document + approved moodboards",
        includes: "",
        duration: "5 days",
      },
    },
  },
  {
    name: "Visual identity (two proposals)",
    content: {
      es: {
        title: "Identidad visual",
        description:
          "Desarrollo del sistema de identidad a partir de la estrategia aprobada. Se presentarán dos propuestas con racionales de diseño para que el equipo de {client} pueda evaluar direcciones y tomar una decisión informada.",
        bullets: ["Dos propuestas de identidad visual con racionales conceptuales"],
        deliverable: "Sistema de identidad visual completo de la propuesta seleccionada",
        includes: "2 rondas de ajustes sobre la propuesta seleccionada",
        duration: "10 días",
      },
      en: {
        title: "Visual identity",
        description:
          "Development of the identity system built on the approved strategy. Two full proposals are presented, each with its own conceptual rationale, giving the {client} team the clarity to evaluate directions and make an informed decision.",
        bullets: ["Two visual identity proposals with conceptual rationales"],
        deliverable: "Complete visual identity system for the selected proposal",
        includes: "2 rounds of revisions on the selected proposal",
        duration: "10 days",
      },
    },
  },
  {
    name: "Visual identity (one proposal)",
    content: {
      es: {
        title: "Identidad visual",
        description:
          "Desarrollo de la identidad visual a partir de la estrategia y moodboard aprobados. Una propuesta de diseño con concepto definido y aplicaciones clave.",
        bullets: ["Propuesta de identidad visual con racional conceptual"],
        deliverable:
          "Reglas básicas de composición y uso + sistema tipográfico funcional + paleta de color: digital, print y video",
        includes: "2 rondas de ajustes",
        duration: "",
      },
      en: {
        title: "Visual identity",
        description:
          "Development of the visual identity built on the approved strategy and moodboard. One design proposal with a defined concept and key applications.",
        bullets: ["Visual identity proposal with conceptual rationale"],
        deliverable:
          "Basic composition and usage rules + functional type system + color palette: digital, print and video",
        includes: "2 rounds of revisions",
        duration: "",
      },
    },
  },
  {
    name: "Brand book (full)",
    content: {
      es: {
        title: "Brand book",
        description:
          "Construcción del manual de marca que funcionará como la fuente única de verdad visual. Incluye una versión robusta para referencia estratégica, una versión resumida para uso operativo del día a día, y una librería de prompts diseñados para garantizar que la generación de assets con herramientas de IA respete los lineamientos de marca.",
        bullets: [
          "Brand book completo con lineamientos de uso, do's & don'ts y ejemplos aplicados",
          "Versión resumida (quick guide) para el equipo operativo",
          "Guidelines de fotografía, ilustración y tratamiento de imagen",
          "Prompts de referencia para generación de assets con herramientas de IA, asegurando la correcta aplicación de los lineamientos de marca en flujos automatizados",
        ],
        deliverable:
          "Brand book (versión completa + versión resumida) + librería de prompts para generación de assets",
        includes: "2 rondas de ajustes",
        duration: "10 días",
      },
      en: {
        title: "Brand book",
        description:
          "Construction of the brand manual that will serve as the single source of visual truth. Includes a complete reference version for strategic use, a condensed quick guide for day-to-day operational use, and a prompt library engineered to ensure AI-generated assets remain within brand guidelines at every touchpoint.",
        bullets: [
          "Complete brand book with usage guidelines, do's & don'ts, and applied examples",
          "Quick guide for the operational team",
          "Photography, illustration, and image treatment guidelines",
          "Reference prompt library for AI asset generation, ensuring brand compliance in automated workflows",
        ],
        deliverable: "Brand book (full version + quick guide) + AI asset prompt library",
        includes: "2 rounds of revisions",
        duration: "10 days",
      },
    },
  },
  {
    name: "Brand book (quick guide)",
    content: {
      es: {
        title: "Brand book",
        description:
          "Manual de marca compacto y operativo que documenta los lineamientos esenciales para mantener consistencia visual. Versión quick guide diseñada para consulta rápida del equipo.",
        bullets: [],
        deliverable: "Brand book resumido con lineamientos de uso",
        includes: "2 rondas de ajustes",
        duration: "",
      },
      en: {
        title: "Brand book",
        description:
          "Compact, operational brand manual documenting the essential guidelines to keep visual consistency. Quick guide version designed for fast reference by the team.",
        bullets: [],
        deliverable: "Condensed brand book with usage guidelines",
        includes: "2 rounds of revisions",
        duration: "",
      },
    },
  },
  {
    name: "Design system",
    content: {
      es: {
        title: "Design system",
        description:
          "Construcción del sistema de diseño estructurado como repositorio de GitHub que funciona como la fuente única de verdad técnica para desarrolladores y diseñadores. Incluye componentes documentados, tokens de diseño, guías de implementación y automatización para mantener la consistencia visual en todo el producto.",
        bullets: [],
        deliverable: "Repositorio en GitHub",
        includes: "2 rondas de ajustes",
        duration: "10 días",
      },
      en: {
        title: "Design system",
        description:
          "Construction of a structured design system delivered as a GitHub repository, functioning as the single source of technical truth for developers and designers. Includes documented components, design tokens, implementation guidelines, and automation protocols to maintain visual consistency across every product touchpoint.",
        bullets: [],
        deliverable: "GitHub repository",
        includes: "2 rounds of revisions",
        duration: "10 days",
      },
    },
  },
  {
    name: "Web design (full site)",
    content: {
      es: {
        title: "Web design",
        description:
          "Traducción del sistema de marca aprobado en una experiencia digital de alta fidelidad. Esta fase cubre el diseño UX/UI completo del sitio web, desde la arquitectura de información y wireframes hasta pantallas listas para desarrollo. Cada layout se diseña como una extensión directa de la marca: coherente, intencional y construido para comunicar.",
        bullets: [],
        deliverable:
          "Archivo de Figma (wireframes + pantallas en alta fidelidad) + prototipo interactivo + paquete de entrega para desarrollo",
        includes: "2 rondas de ajustes en fase de diseño",
        duration: "15 días",
      },
      en: {
        title: "Web design",
        description:
          "Translation of the approved brand system into a high-fidelity digital experience. This phase covers the complete UX/UI design of the website, from information architecture and wireframes to pixel-perfect screens ready for development handoff. Every layout is designed as a direct extension of the brand: coherent, intentional, and built to communicate.",
        bullets: [],
        deliverable:
          "Figma file (wireframes + high-fidelity screens) + interactive prototype + developer handoff package",
        includes: "2 rounds of revisions in the design phase",
        duration: "15 days",
      },
    },
  },
  {
    name: "Web design (landing page)",
    content: {
      es: {
        title: "Web design (landing page)",
        description:
          "Traducción del sistema de identidad en una página funcional. Incluye dirección creativa, diseño de interfaz y aseguración de que cada sección refuerce el posicionamiento estratégico de {client}.",
        bullets: [],
        deliverable: "Diseño completo de landing",
        includes: "2 rondas de ajustes en fase de diseño",
        duration: "",
      },
      en: {
        title: "Web design (landing page)",
        description:
          "Translation of the identity system into a functional page. Includes creative direction, interface design, and making sure every section reinforces {client}'s strategic positioning.",
        bullets: [],
        deliverable: "Complete landing page design",
        includes: "2 rounds of revisions in the design phase",
        duration: "",
      },
    },
  },
  {
    name: "Fee · Service description",
    content: {
      es: {
        title: "Descripción del servicio",
        description:
          "Servicio de art direction y conceptualización continua de piezas digitales para redes sociales y canales digitales. Incluye desarrollo de assets visuales alineados a la identidad de marca, con entrega semanal de contenido visual listo para publicación.",
        bullets: [],
        deliverable: "",
        includes: "",
        duration: "",
      },
      en: {
        title: "Service description",
        description:
          "Ongoing art direction and conceptualization of digital pieces for social media and digital channels. Includes development of visual assets aligned with the brand identity, with weekly delivery of visual content ready to publish.",
        bullets: [],
        deliverable: "",
        includes: "",
        duration: "",
      },
    },
  },
  {
    name: "Fee · Scope",
    content: {
      es: {
        title: "Alcance",
        description: "",
        bullets: [
          "3 piezas digitales semanales",
          "Piezas para stories, feed, carruseles, reels y formatos verticales",
          "Briefing semanal o quincenal con objetivos, temas y dirección visual",
          "Conceptualización y art direction alineada al posicionamiento de marca",
          "Desarrollo de diseños optimizados para cada plataforma digital",
          "Entrega de archivos optimizados por formato y plataforma",
          "2 rondas de ajustes por pieza dentro del mes",
        ],
        deliverable: "",
        includes: "",
        duration: "",
      },
      en: {
        title: "Scope",
        description: "",
        bullets: [
          "3 digital pieces per week",
          "Pieces for stories, feed, carousels, reels and vertical formats",
          "Weekly or biweekly brief with goals, topics and visual direction",
          "Conceptualization and art direction aligned with the brand positioning",
          "Designs optimized for each digital platform",
          "Files delivered optimized per format and platform",
          "2 rounds of revisions per piece within the month",
        ],
        deliverable: "",
        includes: "",
        duration: "",
      },
    },
  },
  {
    name: "Fee · Important specifications",
    content: {
      es: {
        title: "Especificaciones importantes",
        description:
          "Tiempo de anticipación: se requiere mínimo 1 día de anticipación para la conceptualización y el desarrollo de los diseños. Esto permite garantizar calidad, creatividad y alineación con la estrategia visual.",
        bullets: [],
        deliverable: "",
        includes: "",
        duration: "",
      },
      en: {
        title: "Important specifications",
        description:
          "Lead time: at least 1 day in advance is required for the conceptualization and development of the designs. This guarantees quality, creativity and alignment with the visual strategy.",
        bullets: [],
        deliverable: "",
        includes: "",
        duration: "",
      },
    },
  },
  {
    name: "Fee · Exclusions",
    content: {
      es: {
        title: "Exclusiones del servicio",
        description: "",
        bullets: [
          "Este fee no incluye community management ni gestión de comunidades en redes sociales",
          "Este fee no incluye escritura de captions, copy o textos para las publicaciones",
          "Las piezas se entregan como archivos .JPG listos para publicar, con dimensiones optimizadas por plataforma",
        ],
        deliverable: "",
        includes: "",
        duration: "",
      },
      en: {
        title: "Service exclusions",
        description: "",
        bullets: [
          "This fee does not include community management",
          "This fee does not include writing captions, copy or text for the posts",
          "Pieces are delivered as .JPG files ready to publish, with dimensions optimized per platform",
        ],
        deliverable: "",
        includes: "",
        duration: "",
      },
    },
  },
];
