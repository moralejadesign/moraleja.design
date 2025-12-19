// Predefined tags for asset categorization
export const PREDEFINED_TAGS = [
  "Branding",
  "Logos",
  "Animation",
  "Merchandise",
  "AI",
  "Social Media",
  "Character Design",
  "Web Design",
  "Print",
  "Photography",
  "Illustration",
  "Motion Graphics",
  "Packaging",
  "Typography",
] as const;

export type PredefinedTag = (typeof PREDEFINED_TAGS)[number];

export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export function formatTagForDisplay(tag: string): string {
  // Capitalize first letter of each word
  return tag
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}






