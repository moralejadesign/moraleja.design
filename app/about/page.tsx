import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "Moraleja is a Colombian design studio crafting purposeful brand identities that empower startups and small businesses to stand out and build meaningful connections.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background pt-16 md:pt-20">
        <div className="w-full px-4 py-12 md:px-8 md:py-20 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-6xl">
            {/* Main Content Grid */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-24">
              {/* Portrait Section */}
              <div className="relative">
                {/* Decorative lines */}
                <div className="absolute -left-4 top-0 h-full w-px bg-border/60 hidden lg:block" />
                <div className="absolute -left-4 top-12 w-8 h-px bg-border/60 hidden lg:block" />
                <div className="absolute -left-4 bottom-12 w-8 h-px bg-border/60 hidden lg:block" />
                
                {/* Portrait Card */}
                <div className="group relative overflow-visible">
                  {/* Corner crosses */}
                  <span className="corner-cross top-left" aria-hidden="true" />
                  <span className="corner-cross bottom-right" aria-hidden="true" />
                  
                  {/* Dimension label */}
                  <span className="absolute -top-7 left-0 font-mono text-xs text-muted-foreground/50">
                    founder
                  </span>
                  
                  <div className="card-border relative aspect-[4/5] w-full overflow-hidden">
                    <img
                      src="https://oi0bl4shqruqbuco.public.blob.vercel-storage.com/moraleja_picture.png"
                      alt="Aleja, founder of Moraleja Design"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    
                    {/* Subtle overlay gradient for light image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  </div>
                  
                  {/* Name badge */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-foreground text-lg font-medium tracking-wide">
                      Aleja
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Graphic Designer · Colombia
                    </p>
                  </div>
                </div>
                
                {/* Experience badge */}
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="h-px w-8 bg-border" />
                    <span className="font-mono text-xs text-muted-foreground">9+ years</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-px w-8 bg-border" />
                    <span className="font-mono text-xs text-muted-foreground">brand identity</span>
                  </div>
                </div>
              </div>
              
              {/* Text Content */}
              <div className="relative flex flex-col justify-center">
                {/* Decorative vertical line */}
                <div className="absolute -right-4 top-0 h-full w-px bg-border/40 hidden xl:block" />
                
                {/* Small intro */}
                <p className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  About Moraleja
                </p>
                
                {/* Main heading */}
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                  Building brands
                  <br />
                  <span className="text-muted-foreground">with soul</span>
                </h1>
                
                {/* Horizontal line */}
                <div className="my-8 h-px w-16 bg-foreground/20" />
                
                {/* Bio paragraphs */}
                <div className="space-y-6 text-muted-foreground leading-relaxed">
                  <p className="text-base md:text-lg">
                    At Moraleja, we craft purposeful brand identities that empower startups and 
                    small businesses to stand out, inspire trust, and build meaningful connections 
                    with the people they serve.
                  </p>
                  
                  <p>
                    As a Colombian design studio, we bring over nine years of agency experience to 
                    our true passion: building brands with soul. We believe design is a powerful 
                    narrative tool. Through color, typography, animation, and illustration, we help 
                    brands tell their unique stories and forge genuine connections with their audiences.
                  </p>
                </div>
                
                {/* Skills/Focus areas */}
                <div className="mt-10 flex flex-wrap gap-2">
                  {["Brand Identity", "Typography", "Illustration", "Animation", "Visual Design"].map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 text-xs font-medium border border-border/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                
                {/* CTA */}
                <div className="mt-10">
                  <a
                    href="/contact"
                    className="group inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
                  >
                    <span>Let's work together</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

