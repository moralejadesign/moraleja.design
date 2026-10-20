import type {
  BriefingAnswer,
  BriefingLink,
  BriefingQuestion,
  BriefingQuestionContent,
  BriefingQuestionType,
  BriefingStatus,
  BriefingTopic,
  Briefing,
  BudgetLanguage,
} from "@/db/schema";
import { newSectionId } from "./budgets";

export const BRIEFING_STATUSES: { value: BriefingStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

/** Section headings, shown to the client and in the exported document. */
export const BRIEFING_TOPICS: { value: BriefingTopic; label: Record<BudgetLanguage, string> }[] = [
  { value: "business", label: { es: "El negocio", en: "The business" } },
  { value: "audience", label: { es: "Audiencia", en: "Audience" } },
  { value: "competition", label: { es: "Competencia y referentes", en: "Competition and references" } },
  { value: "personality", label: { es: "Personalidad", en: "Personality" } },
  { value: "visual", label: { es: "Identidad visual", en: "Visual identity" } },
  { value: "logistics", label: { es: "Proyecto", en: "Project" } },
];

export function topicLabel(topic: BriefingTopic, language: BudgetLanguage) {
  return BRIEFING_TOPICS.find((t) => t.value === topic)?.label[language] ?? topic;
}

export const QUESTION_TYPES: { value: BriefingQuestionType; label: string }[] = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "single_choice", label: "Single choice" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "slider", label: "Slider (two opposite words)" },
  { value: "links", label: "Links" },
  { value: "files", label: "File upload" },
];

export function questionTypeLabel(type: BriefingQuestionType) {
  return QUESTION_TYPES.find((t) => t.value === type)?.label ?? type;
}

export const isChoiceType = (type: BriefingQuestionType) =>
  type === "single_choice" || type === "multiple_choice";

export function emptyQuestionContent(): BriefingQuestionContent {
  return { title: "", help: "", options: [], minLabel: "", maxLabel: "" };
}

export function emptyQuestion(topic: BriefingTopic = "business"): BriefingQuestion {
  return {
    id: newSectionId(),
    topic,
    type: "long_text",
    required: false,
    ...emptyQuestionContent(),
  };
}

export function questionFromLibrary(
  question: { topic: BriefingTopic; type: BriefingQuestionType; required: boolean },
  content: BriefingQuestionContent
): BriefingQuestion {
  return {
    id: newSectionId(),
    topic: question.topic,
    type: question.type,
    required: question.required,
    ...content,
    options: [...content.options],
  };
}

/** Files a client can attach to "files" questions: images, PDFs, design files and zips. */
export const BRIEFING_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/heic",
  "application/pdf",
  "application/postscript", // .ai, .eps
  "application/illustrator",
  "application/zip",
  "application/x-zip-compressed",
];
export const BRIEFING_UPLOAD_ACCEPT = "image/*,.pdf,.ai,.eps,.svg,.zip";
export const BRIEFING_UPLOAD_MAX_MB = 25;

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|svg|heic)(\?|$)/i;
export const isImageUrl = (url: string) => IMAGE_EXTENSIONS.test(url);

/** Files uploaded from the briefing form live in the site's Blob store; anything else is a pasted link. */
export const isUploaded = (item: BriefingLink) => item.url.includes(".blob.vercel-storage.com/briefings/");

/** Points on a slider, from the left word (1) to the right word (SLIDER_STEPS). */
export const SLIDER_STEPS = 5;

/** Choice options without the blank lines left while editing. */
export const choiceOptions = (question: Pick<BriefingQuestion, "options">) =>
  question.options.map((o) => o.trim()).filter(Boolean);

export function isAnswered(answer: BriefingAnswer | undefined) {
  if (answer === undefined || answer === null) return false;
  if (typeof answer === "string") return answer.trim() !== "";
  if (Array.isArray(answer)) return answer.length > 0;
  return true;
}

/** Answered questions out of the total; counts only non-empty answers. */
export function answeredCount(briefing: Pick<Briefing, "questions" | "answers">) {
  return briefing.questions.filter((q) => isAnswered(briefing.answers[q.id])).length;
}

export function missingRequired(questions: BriefingQuestion[], answers: Record<string, BriefingAnswer>) {
  return questions.filter((q) => q.required && isAnswered(answers[q.id]) === false);
}

const MAX_TEXT = 10_000;
const MAX_LINKS = 20;

/**
 * Keeps only answers to this briefing's questions, in the shape each type expects.
 * Runs on the server for everything the client sends.
 */
export function sanitizeAnswers(
  questions: BriefingQuestion[],
  input: unknown
): Record<string, BriefingAnswer> {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const clean: Record<string, BriefingAnswer> = {};
  const text = (v: unknown, max = MAX_TEXT) => (typeof v === "string" ? v.slice(0, max) : "");

  for (const question of questions) {
    const value = raw[question.id];
    if (value === undefined || value === null) continue;

    switch (question.type) {
      case "short_text":
      case "long_text": {
        const answer = text(value);
        if (answer) clean[question.id] = answer;
        break;
      }
      case "single_choice": {
        if (typeof value === "string" && choiceOptions(question).includes(value)) clean[question.id] = value;
        break;
      }
      case "multiple_choice": {
        const options = choiceOptions(question);
        if (Array.isArray(value)) {
          const picked = options.filter((o) => value.includes(o));
          if (picked.length) clean[question.id] = picked;
        }
        break;
      }
      case "slider": {
        if (Number.isInteger(value) && (value as number) >= 1 && (value as number) <= SLIDER_STEPS) {
          clean[question.id] = value as number;
        }
        break;
      }
      case "links":
      case "files": {
        if (Array.isArray(value)) {
          const links: BriefingLink[] = value
            .slice(0, MAX_LINKS)
            .map((l) => ({ url: text(l?.url, 2000).trim(), note: text(l?.note, 2000) }))
            .filter((l) => l.url || l.note);
          if (links.length) clean[question.id] = links;
        }
        break;
      }
    }
  }
  return clean;
}

export const DEFAULT_INTRO: Record<BudgetLanguage, string> = {
  es: "Estas preguntas nos ayudan a entender tu negocio antes de diseñar. No hay respuestas correctas: escribe como hablas. Tus respuestas se guardan solas, así que puedes volver cuando quieras.",
  en: "These questions help us understand your business before we design. There are no right answers: write the way you talk. Your answers save automatically, so you can come back anytime.",
};

export function briefingHeading(briefing: Pick<Briefing, "title" | "clientName">) {
  return briefing.title?.trim() || `${briefing.clientName.toUpperCase()} BRIEFING`;
}

type StarterQuestion = {
  topic: BriefingTopic;
  type: BriefingQuestionType;
  required: boolean;
  content: Record<BudgetLanguage, BriefingQuestionContent>;
};

function q(
  topic: BriefingTopic,
  type: BriefingQuestionType,
  required: boolean,
  es: Partial<BriefingQuestionContent> & { title: string },
  en: Partial<BriefingQuestionContent> & { title: string }
): StarterQuestion {
  return {
    topic,
    type,
    required,
    content: {
      es: { ...emptyQuestionContent(), ...es },
      en: { ...emptyQuestionContent(), ...en },
    },
  };
}

function slider(es: [string, string], en: [string, string]): StarterQuestion {
  return q(
    "personality",
    "slider",
    true,
    { title: `¿Más ${es[0].toLowerCase()} o más ${es[1].toLowerCase()}?`, minLabel: es[0], maxLabel: es[1] },
    { title: `More ${en[0].toLowerCase()} or more ${en[1].toLowerCase()}?`, minLabel: en[0], maxLabel: en[1] }
  );
}

const SKIP_IF_NEW = {
  es: "Si es una marca nueva, puedes saltar esta pregunta.",
  en: "If this is a new brand, you can skip this question.",
};

/** Branding questionnaire to start the library with. */
export const STARTER_QUESTIONS: StarterQuestion[] = [
  // Business
  q(
    "business",
    "short_text",
    true,
    { title: "¿Cuál es el nombre de la marca?", help: "Si todavía es provisional, escríbelo igual." },
    { title: "What is the brand's name?", help: "If it's still a working name, write it anyway." }
  ),
  q(
    "business",
    "single_choice",
    true,
    {
      title: "¿El nombre ya está definido?",
      options: [
        "Sí, es definitivo",
        "Es provisional, podría cambiar",
        "Todavía no tenemos nombre, necesitamos ayuda",
      ],
    },
    {
      title: "Is the name final?",
      options: [
        "Yes, it's final",
        "It's a working name, it could change",
        "We don't have a name yet and need help",
      ],
    }
  ),
  q(
    "business",
    "long_text",
    false,
    {
      title: "¿Qué significa el nombre o de dónde viene?",
      help: "Si aún no hay nombre, puedes saltar esta pregunta.",
    },
    {
      title: "What does the name mean, or where does it come from?",
      help: "If there's no name yet, you can skip this question.",
    }
  ),
  q(
    "business",
    "long_text",
    true,
    {
      title: "¿Qué hace tu empresa y qué problema resuelve?",
      help: "Explícalo como se lo contarías a alguien que no conoce tu industria.",
    },
    {
      title: "What does your company do, and what problem does it solve?",
      help: "Explain it as you would to someone outside your industry.",
    }
  ),
  q(
    "business",
    "long_text",
    true,
    { title: "¿Cuál es el propósito de la empresa, más allá de vender?" },
    { title: "What is the company's core purpose, beyond selling?" }
  ),
  q(
    "business",
    "long_text",
    false,
    {
      title: "¿Qué productos, servicios o características clave debería conocer la gente?",
      help: "Lo que ofreces y lo que más quieres que se destaque.",
    },
    {
      title: "Which key products, services or features should people know about?",
      help: "What you offer and what you most want to stand out.",
    }
  ),
  q(
    "business",
    "long_text",
    false,
    { title: "¿Cómo nació la marca?", help: "La historia detrás: quién la fundó, por qué y cuándo." },
    { title: "How did the brand start?", help: "The story behind it: who founded it, why and when." }
  ),
  q(
    "business",
    "single_choice",
    true,
    {
      title: "¿Qué necesitas en este proyecto?",
      options: [
        "Una marca nueva desde cero",
        "Un rebranding completo",
        "Un refresh de la marca actual",
        "Una sub-marca o marca de producto",
      ],
    },
    {
      title: "What do you need from this project?",
      options: [
        "A brand new identity from scratch",
        "A full rebrand",
        "A refresh of the current brand",
        "A sub-brand or product brand",
      ],
    }
  ),
  q(
    "business",
    "long_text",
    false,
    {
      title: "¿Por qué cambiar ahora? ¿Qué no está funcionando?",
      help: "Reposicionamiento, fusión, identidad desactualizada, nueva audiencia, expansión… Si es una marca nueva, puedes saltar esta pregunta.",
    },
    {
      title: "Why change now? What isn't working?",
      help: "Repositioning, a merger, an outdated identity, a new audience, expansion… If this is a new brand, you can skip this question.",
    }
  ),
  q(
    "business",
    "long_text",
    true,
    { title: "¿Dónde ves la marca en 5 años?" },
    { title: "Where do you see the brand in 5 years?" }
  ),
  q(
    "business",
    "long_text",
    false,
    { title: "¿Qué valores no son negociables para ustedes?", help: "Entre 3 y 5 palabras o frases cortas." },
    { title: "Which values are non-negotiable for you?", help: "3 to 5 words or short phrases." }
  ),

  // Audience
  q(
    "audience",
    "long_text",
    true,
    {
      title: "¿Quién es tu cliente ideal?",
      help: "Edad, ocupación, qué le importa y cómo decide comprar.",
    },
    {
      title: "Who is your ideal customer?",
      help: "Age, occupation, what they care about and how they decide to buy.",
    }
  ),
  q(
    "audience",
    "long_text",
    true,
    { title: "¿Qué problemas o necesidades tiene esa audiencia que tú resuelves?" },
    { title: "What problems or needs does that audience have that you solve?" }
  ),
  q(
    "audience",
    "long_text",
    true,
    { title: "¿Qué quieres que la gente sienta o piense al ver tu marca?" },
    { title: "What should people feel or think when they see your brand?" }
  ),
  q(
    "audience",
    "long_text",
    false,
    { title: "¿Qué dicen hoy tus clientes de ti?", help: "Elogios, quejas, frases que repiten." },
    { title: "What do your customers say about you today?", help: "Praise, complaints, phrases they repeat." }
  ),
  q(
    "audience",
    "long_text",
    false,
    { title: "¿Qué necesita ver o sentir tu audiencia para confiar en ti?" },
    { title: "What does your audience need to see or feel to trust you?" }
  ),
  q(
    "audience",
    "multiple_choice",
    true,
    {
      title: "¿Dónde vive principalmente la marca?",
      options: [
        "Redes sociales",
        "Sitio web",
        "App",
        "Empaque",
        "Punto de venta físico",
        "Papelería e impresos",
        "Eventos",
        "Señalización",
      ],
    },
    {
      title: "Where does the brand mostly live?",
      options: [
        "Social media",
        "Website",
        "App",
        "Packaging",
        "Physical store",
        "Stationery and print",
        "Events",
        "Signage",
      ],
    }
  ),

  // Competition and references
  q(
    "competition",
    "links",
    true,
    {
      title: "¿Quiénes son tus principales competidores?",
      help: "Agrega su sitio web o redes y, si quieres, una nota sobre cada uno.",
    },
    {
      title: "Who are your main competitors?",
      help: "Add their website or social profile and, if you like, a note on each one.",
    }
  ),
  q(
    "competition",
    "long_text",
    false,
    { title: "¿Qué hacen bien tus competidores y en qué se quedan cortos?" },
    { title: "What do your competitors do well, and where do they fall short?" }
  ),
  q(
    "competition",
    "long_text",
    true,
    { title: "¿Qué te hace diferente de tu competencia?" },
    { title: "What makes you different from your competitors?" }
  ),
  q(
    "competition",
    "long_text",
    false,
    {
      title: "¿Dónde quieres ubicarte en el mercado frente a ellos?",
      help: "Por ejemplo: más premium, más cercano, más especializado, más accesible.",
    },
    {
      title: "Where do you want to sit in the market relative to them?",
      help: "For example: more premium, more approachable, more specialized, more affordable.",
    }
  ),
  q(
    "competition",
    "long_text",
    false,
    { title: "¿Qué tendencias están marcando tu industria hoy?" },
    { title: "What trends are shaping your industry right now?" }
  ),
  q(
    "competition",
    "long_text",
    false,
    { title: "¿Cómo podría tu marca aprovechar esas tendencias?" },
    { title: "How could your brand take advantage of those trends?" }
  ),
  q(
    "competition",
    "links",
    false,
    {
      title: "¿Qué marcas admiras, aunque sean de otra industria?",
      help: "Cuéntanos qué te gusta de cada una.",
    },
    {
      title: "Which brands do you admire, even from other industries?",
      help: "Tell us what you like about each one.",
    }
  ),
  q(
    "competition",
    "links",
    false,
    {
      title: "¿A qué marcas no te quieres parecer?",
      help: "Agrega el enlace y cuéntanos por qué.",
    },
    {
      title: "Which brands do you not want to resemble?",
      help: "Add the link and tell us why.",
    }
  ),

  // Personality
  q(
    "personality",
    "short_text",
    true,
    { title: "Describe tu marca en tres palabras." },
    { title: "Describe your brand in three words." }
  ),
  q(
    "personality",
    "multiple_choice",
    true,
    {
      title: "¿Cómo debería sonar la marca?",
      help: "Elige hasta tres.",
      options: ["Formal", "Cercana", "Divertida", "Experta", "Atrevida", "Cálida", "Inspiradora", "Directa"],
    },
    {
      title: "How should the brand sound?",
      help: "Pick up to three.",
      options: ["Formal", "Friendly", "Playful", "Expert", "Bold", "Warm", "Inspiring", "Direct"],
    }
  ),
  slider(["Clásica", "Moderna"], ["Classic", "Modern"]),
  slider(["Seria", "Divertida"], ["Serious", "Playful"]),
  slider(["Exclusiva", "Accesible"], ["Exclusive", "Accessible"]),
  slider(["Minimalista", "Expresiva"], ["Minimal", "Expressive"]),
  slider(["Racional", "Emocional"], ["Rational", "Emotional"]),
  slider(["Discreta", "Atrevida"], ["Understated", "Bold"]),
  q(
    "personality",
    "long_text",
    false,
    {
      title: "Si tu marca fuera una persona, ¿cómo sería?",
      help: "Cómo habla, cómo se viste, qué hace un sábado.",
    },
    {
      title: "If your brand were a person, what would they be like?",
      help: "How they talk, how they dress, what they do on a Saturday.",
    }
  ),
  q(
    "personality",
    "long_text",
    false,
    { title: "Si tu marca fuera un animal, ¿cuál sería y por qué?" },
    { title: "If your brand were an animal, which one would it be, and why?" }
  ),
  q(
    "personality",
    "short_text",
    false,
    { title: "¿Qué palabras nunca deberían describir tu marca?" },
    { title: "Which words should never describe your brand?" }
  ),

  // Visual identity: the current one, if there is one
  q(
    "visual",
    "single_choice",
    false,
    {
      title: "¿Qué tanto quieres conservar de la marca actual?",
      options: [
        "Casi todo",
        "Evolucionar, manteniendo lo reconocible",
        "Cambiarla por completo",
        "No aplica, es una marca nueva",
      ],
    },
    {
      title: "How much of the current brand do you want to keep?",
      options: [
        "Almost everything",
        "Evolve it, keeping what's recognizable",
        "Change it completely",
        "Not applicable, it's a new brand",
      ],
    }
  ),
  q(
    "visual",
    "files",
    false,
    {
      title: "Sube tu logo actual y otros materiales de marca.",
      help: `Logo, manual de marca, piezas que ya usen. ${SKIP_IF_NEW.es}`,
    },
    {
      title: "Upload your current logo and other brand materials.",
      help: `Logo, brand guidelines, pieces you already use. ${SKIP_IF_NEW.en}`,
    }
  ),
  q(
    "visual",
    "long_text",
    false,
    { title: "Describe tu identidad actual: colores, tipografías y estilo visual.", help: SKIP_IF_NEW.es },
    { title: "Describe your current identity: colors, typefaces and visual style.", help: SKIP_IF_NEW.en }
  ),
  q(
    "visual",
    "long_text",
    false,
    { title: "¿Qué funciona y qué no en tu identidad actual?", help: SKIP_IF_NEW.es },
    { title: "What's working and what isn't in your current identity?", help: SKIP_IF_NEW.en }
  ),

  // Visual identity: what to build, also for brands starting from nothing
  q(
    "visual",
    "single_choice",
    false,
    {
      title: "¿Qué tipo de logo imaginas?",
      options: [
        "Solo el nombre, con una tipografía propia",
        "Un símbolo acompañado del nombre",
        "Un emblema o sello",
        "Aún no lo sé, confío en su criterio",
      ],
    },
    {
      title: "What kind of logo do you picture?",
      options: [
        "Just the name, in a distinctive typeface",
        "A symbol alongside the name",
        "An emblem or badge",
        "Not sure yet, I trust your judgment",
      ],
    }
  ),
  q(
    "visual",
    "long_text",
    false,
    {
      title: "¿Qué colores sientes propios de tu marca?",
      help: "Colores concretos o las emociones que quieres que transmitan. Si no tienes idea, también está bien.",
    },
    {
      title: "Which colors feel like your brand?",
      help: "Specific colors, or the emotions you want them to convey. It's fine if you have no idea yet.",
    }
  ),
  q(
    "visual",
    "short_text",
    false,
    { title: "¿Hay colores que definitivamente no quieres?" },
    { title: "Are there colors you definitely don't want?" }
  ),
  q(
    "visual",
    "single_choice",
    false,
    {
      title: "¿Qué estilo de letra imaginas para tu marca?",
      options: [
        "Clásica, con serifa",
        "Moderna y limpia",
        "Geométrica o técnica",
        "Manuscrita o caligráfica",
        "Con mucha personalidad",
        "No lo sé",
      ],
    },
    {
      title: "What style of lettering do you picture for your brand?",
      options: [
        "Classic, with serifs",
        "Modern and clean",
        "Geometric or technical",
        "Handwritten or calligraphic",
        "Full of character",
        "Not sure",
      ],
    }
  ),
  q(
    "visual",
    "multiple_choice",
    false,
    {
      title: "¿Qué tipo de imágenes imaginas para tu marca?",
      options: ["Fotografía", "Ilustración", "Formas y gráficos abstractos", "Íconos", "Solo tipografía y color"],
    },
    {
      title: "What kind of imagery do you picture for your brand?",
      options: ["Photography", "Illustration", "Abstract shapes and graphics", "Icons", "Just type and color"],
    }
  ),
  q(
    "visual",
    "files",
    false,
    { title: "Sube imágenes que te inspiren.", help: "Fotos, marcas, espacios, objetos: lo que se sienta como tu marca." },
    { title: "Upload images that inspire you.", help: "Photos, brands, spaces, objects: whatever feels like your brand." }
  ),
  q(
    "visual",
    "long_text",
    false,
    { title: "¿Hay algún estilo visual que te guste o que quieras evitar?" },
    { title: "Is there a visual style you like or want to avoid?" }
  ),

  // Project
  q(
    "logistics",
    "short_text",
    true,
    { title: "¿Quién toma la decisión final sobre la marca?", help: "Nombre y cargo." },
    { title: "Who makes the final decision on the brand?", help: "Name and role." }
  ),
  q(
    "logistics",
    "short_text",
    false,
    { title: "¿Hay una fecha límite o un lanzamiento?" },
    { title: "Is there a deadline or a launch date?" }
  ),
  q(
    "logistics",
    "multiple_choice",
    false,
    {
      title: "¿Qué piezas necesitas primero?",
      options: [
        "Logo",
        "Redes sociales",
        "Sitio web",
        "Papelería (tarjetas, hojas membreteadas)",
        "Empaque",
        "Presentación comercial",
        "Señalización",
        "Uniformes",
      ],
    },
    {
      title: "Which pieces do you need first?",
      options: [
        "Logo",
        "Social media",
        "Website",
        "Stationery (business cards, letterhead)",
        "Packaging",
        "Sales deck",
        "Signage",
        "Uniforms",
      ],
    }
  ),
  q(
    "logistics",
    "long_text",
    false,
    { title: "¿Qué más deberíamos saber?" },
    { title: "What else should we know?" }
  ),
];

const CURRENT_BRAND_QUESTIONS = [
  "¿Por qué cambiar ahora? ¿Qué no está funcionando?",
  "¿Qué dicen hoy tus clientes de ti?",
  "¿Qué tanto quieres conservar de la marca actual?",
  "Sube tu logo actual y otros materiales de marca.",
  "Describe tu identidad actual: colores, tipografías y estilo visual.",
  "¿Qué funciona y qué no en tu identidad actual?",
];

/**
 * Templates to start with, matched to library questions by Spanish title.
 * `include` lists the questions; `exclude` means everything else in the library.
 */
export const STARTER_TEMPLATES: {
  name: string;
  description: string;
  include?: string[];
  exclude?: string[];
}[] = [
  {
    name: "New brand",
    description: "Everything except the questions about a current logo or identity.",
    exclude: CURRENT_BRAND_QUESTIONS,
  },
  {
    name: "Rebrand",
    description: "The full questionnaire, including what works in the current identity.",
    exclude: ["¿El nombre ya está definido?"],
  },
  {
    name: "Quick logo",
    description: "Around 20 questions for a logo or a small identity project.",
    include: [
      "¿Cuál es el nombre de la marca?",
      "¿El nombre ya está definido?",
      "¿Qué significa el nombre o de dónde viene?",
      "¿Qué hace tu empresa y qué problema resuelve?",
      "¿Quién es tu cliente ideal?",
      "¿Qué quieres que la gente sienta o piense al ver tu marca?",
      "¿Quiénes son tus principales competidores?",
      "¿Qué te hace diferente de tu competencia?",
      "Describe tu marca en tres palabras.",
      "¿Más clásica o más moderna?",
      "¿Más seria o más divertida?",
      "¿Más minimalista o más expresiva?",
      "¿Qué tipo de logo imaginas?",
      "¿Qué colores sientes propios de tu marca?",
      "¿Hay colores que definitivamente no quieres?",
      "¿Qué estilo de letra imaginas para tu marca?",
      "Sube imágenes que te inspiren.",
      "¿Quién toma la decisión final sobre la marca?",
      "¿Hay una fecha límite o un lanzamiento?",
    ],
  },
];
