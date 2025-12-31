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
  
  socialLinks: {
    website: string;
    instagram: string;
    contact: string;
  };
}

