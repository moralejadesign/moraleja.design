import { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { PageIntro, SectionTitle } from "@/components/page-intro";
import { AboutImage } from "./about-image";

export const metadata: Metadata = {
  title: "About",
  description: "Moraleja is a Colombian design studio crafting purposeful brand identities that empower startups and small businesses to stand out and build meaningful connections.",
};

const focusAreas = ["Brand Identity", "Typography", "Illustration", "Animation", "Visual Design"];

export default function AboutPage() {
  return (
    <>
      <PageIntro
        name="Moraleja"
        statement="is building brands with soul."
        lede="Purposeful brand identities that help startups and small businesses stand out, inspire trust, and build meaningful connections with the people they serve."
      />

      <section className="grid gap-10 md:grid-cols-[2fr_3fr] md:gap-8">
        {/* Portrait Card */}
        <div className="group relative self-start">
          <span className="corner-cross top-left" aria-hidden="true" />
          <span className="corner-cross bottom-right" aria-hidden="true" />

          <div className="card-border relative aspect-[4/5] w-full overflow-hidden rounded-lg">
            <AboutImage />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-lg font-medium tracking-wide text-foreground">Aleja</p>
            <p className="text-sm text-muted-foreground">Graphic Designer · Colombia</p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-px w-8 bg-border" />
              <span className="font-mono text-xs text-muted-foreground">9+ years</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-px w-8 bg-border" />
              <span className="font-mono text-xs text-muted-foreground">brand identity</span>
            </div>
          </div>

          <p className="text-xl font-light leading-[1.3] tracking-[-0.4px] md:text-2xl">
            As a Colombian design studio, we bring over nine years of agency experience to our true
            passion: building brands with soul.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            We believe design is a powerful narrative tool. Through color, typography, animation, and
            illustration, we help brands tell their unique stories and forge genuine connections with
            their audiences.
          </p>

          <a
            href="/contact"
            className="group/cta inline-flex items-center gap-2 self-start text-sm font-medium text-foreground transition-colors hover:text-brand-ink"
          >
            <span>Let&apos;s work together</span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5" />
          </a>
        </div>
      </section>

      <SectionTitle id="focus">what we do:</SectionTitle>
      <section aria-labelledby="focus" className="flex flex-col gap-2">
        {focusAreas.map((area, index) => (
          <div
            key={area}
            className="flex items-center justify-between gap-4 rounded-lg bg-secondary p-4 text-secondary-foreground transition-colors hover:bg-brand-accent hover:text-black"
          >
            <h3 className="text-lg font-normal leading-none tracking-[-0.4px] md:text-xl">{area}</h3>
            <p className="font-mono text-sm leading-none opacity-70">{String(index + 1).padStart(2, "0")}</p>
          </div>
        ))}
      </section>
    </>
  );
}
