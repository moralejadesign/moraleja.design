export const wrappedConfig = {
  year: 2025,
  
  // Manual metrics (values not available from database)
  videoEditingMinutes: 2400, // ~40 hours of video editing
  
  // Industries served
  industries: [
    "Technology",
    "Finance",
    "Healthcare",
    "E-commerce",
    "Education",
    "Entertainment",
  ],
  
  // Countries reached
  countries: [
    { name: "Colombia", flag: "🇨🇴" },
    { name: "United States", flag: "🇺🇸" },
    { name: "Perú", flag: "🇵🇪" },
  ],
  
  // Featured project slug (must exist in database)
  featuredProjectSlug: "kebo",
  
  // Studio info
  studio: {
    name: "Moraleja Design",
    tagline: "Building brands with soul",
    description: "Creative studio shaping brands, visuals, and experiences.",
    foundedYear: 2016,
    location: "Colombia",
  },
  
  // Social links for outro
  socialLinks: {
    website: "https://moraleja.design",
    instagram: "https://www.instagram.com/alejandramoralesgarzon_/",
    contact: "/contact",
  },
} as const;

export type WrappedConfig = typeof wrappedConfig;

