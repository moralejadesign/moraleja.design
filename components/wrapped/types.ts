export interface WrappedData {
  year: number;
  generatedAt: string;
  
  metrics: {
    totalProjects: number;
    totalAssets: number;
    totalVideos: number;
    totalImages: number;
  };
  
  videoEditingMinutes: number;
  tools: Array<{ name: string; icon: string }>;
  industries: string[];
  countries: Array<{ name: string; flag: string }>;
  
  projects: Array<{
    slug: string;
    title: string;
    thumbnail: string;
  }>;
  
  featuredProject: {
    slug: string;
    title: string;
    thumbnail: string;
  } | null;
  
  studio: {
    name: string;
    tagline: string;
    description: string;
    foundedYear: number;
    location: string;
  };
  
  founder: {
    name: string;
    role: string;
    image: string;
    quote: string;
  };
  
  socialLinks: {
    website: string;
    instagram: string;
    contact: string;
  };
}

