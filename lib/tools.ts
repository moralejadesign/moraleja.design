// Suggested design/build tools, seeded from the Lab section's tool list.
// Any project can add tools beyond this list.
export const PREDEFINED_TOOLS = [
  "v0",
  "Cursor",
  "Claude Code",
  "Midjourney",
  "Higgsfield",
  "Image 2.0",
  "Nano Banana",
] as const;

const TOOL_COLORS: Record<string, string> = {
  "v0": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "Cursor": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Claude Code": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  "Midjourney": "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  "Higgsfield": "bg-green-500/10 text-green-600 dark:text-green-400",
  "Image 2.0": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  "Nano Banana": "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
};

// Palette for tools not in TOOL_COLORS (e.g. Figma, Photoshop, or anything
// typed in as a custom tool) — picked deterministically from the tool name.
const FALLBACK_PALETTE = [
  "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "bg-lime-500/10 text-lime-600 dark:text-lime-400",
  "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getToolColor(tool: string): string {
  return TOOL_COLORS[tool] ?? FALLBACK_PALETTE[hashString(tool) % FALLBACK_PALETTE.length];
}
