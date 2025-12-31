"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { getBlobUrl } from "@/lib/config";
import { ScrollElement } from "./scroll-element";
import { StatCard } from "./stat-card";
import { KeyboardHint } from "./keyboard-hint";
import type { WrappedData } from "./types";

interface DesktopWrappedProps {
  data: WrappedData;
}

export function DesktopWrapped({ data }: DesktopWrappedProps) {
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);
  const [currentSection, setCurrentSection] = useState(0);
  const totalSections = 10;

  const scrollToSection = useCallback((index: number) => {
    const section = sectionsRef.current[index];
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentSection(index);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = Math.min(currentSection + 1, totalSections - 1);
        scrollToSection(nextIndex);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = Math.max(currentSection - 1, 0);
        scrollToSection(prevIndex);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSection, scrollToSection]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionsRef.current.findIndex(
              (ref) => ref === entry.target
            );
            if (index !== -1) setCurrentSection(index);
          }
        });
      },
      { threshold: 0.5 }
    );

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <KeyboardHint currentSection={currentSection} totalSections={totalSections} />

      {/* Intro Section */}
      <section
        ref={(el) => {
          sectionsRef.current[0] = el;
        }}
        className="relative flex min-h-screen flex-col items-center justify-center px-4 py-20"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-accent/5 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
        </div>

        {/* Decorative lines - left */}
        <div className="absolute left-8 top-24 bottom-24 w-px bg-border/20 lg:left-16" />
        <div className="absolute left-8 top-1/4 w-12 h-px bg-border/20 lg:left-16" />
        <div className="absolute left-8 top-1/2 w-8 h-px bg-border/20 lg:left-16" />
        <div className="absolute left-8 top-3/4 w-12 h-px bg-border/20 lg:left-16" />

        {/* Decorative lines - right */}
        <div className="absolute right-8 top-24 bottom-24 w-px bg-border/20 lg:right-16" />
        <div className="absolute right-8 top-1/4 w-12 h-px bg-border/20 -translate-x-full lg:right-16" />
        <div className="absolute right-8 top-1/2 w-8 h-px bg-border/20 -translate-x-full lg:right-16" />
        <div className="absolute right-8 top-3/4 w-12 h-px bg-border/20 -translate-x-full lg:right-16" />

        {/* Corner accents */}
        <div className="absolute left-8 top-24 w-3 h-3 border-l border-t border-border/30 lg:left-16" />
        <div className="absolute right-8 top-24 w-3 h-3 border-r border-t border-border/30 lg:right-16" />
        <div className="absolute left-8 bottom-24 w-3 h-3 border-l border-b border-border/30 lg:left-16" />
        <div className="absolute right-8 bottom-24 w-3 h-3 border-r border-b border-border/30 lg:right-16" />

        <ScrollElement direction="up">
          <div className="relative mb-8">
            <div className="absolute -inset-4 rounded-full bg-brand-accent/10 blur-2xl" />
            <img
              src="/brand_assets/MORALEJA_BRAND.svg"
              alt="Moraleja"
              className="relative h-16 w-auto invert dark:invert-0"
            />
          </div>
        </ScrollElement>

        <ScrollElement direction="up" delay={0.1}>
          <h1 className="text-center text-2xl font-medium tracking-tight text-foreground">
            {data.studio.name}
          </h1>
        </ScrollElement>

        <ScrollElement direction="up" delay={0.2}>
          <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
            {data.studio.description}
          </p>
        </ScrollElement>

        <ScrollElement direction="up" delay={0.4}>
          <div className="mt-10 flex flex-col items-center">
            <span className="text-8xl font-extralight tracking-tighter text-foreground md:text-9xl">
              {data.year}
            </span>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-px w-8 bg-border" />
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Wrapped
              </span>
              <span className="h-px w-8 bg-border" />
            </div>
          </div>
        </ScrollElement>

        <ScrollElement direction="none" delay={0.6}>
          <p className="mt-12 text-center font-mono text-xs text-muted-foreground/50">
            Scroll to explore
          </p>
        </ScrollElement>
      </section>

      {/* Partners Section */}
      <section
        ref={(el) => {
          sectionsRef.current[1] = el;
        }}
        className="flex min-h-[80vh] items-center py-20"
      >
        <div className="mx-auto w-full max-w-2xl px-4 md:px-8">
          <ScrollElement direction="up">
            <h2 className="mb-10 text-center text-2xl font-light text-foreground sm:text-3xl">
              Trusted by
            </h2>
          </ScrollElement>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {data.projects.slice(0, 6).map((project, i) => (
              <ScrollElement
                key={project.slug}
                direction={i % 3 === 0 ? "left" : i % 3 === 2 ? "right" : "up"}
                delay={i * 0.1}
              >
                <div className="group relative overflow-visible">
                  <span className="corner-cross top-left" aria-hidden="true" />
                  <span className="corner-cross bottom-right" aria-hidden="true" />
                  <div className="card-border bg-card/20 aspect-[4/3] overflow-hidden">
                    <Image
                      src={project.thumbnail}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 300px"
                    />
                  </div>
                </div>
              </ScrollElement>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section
        ref={(el) => {
          sectionsRef.current[2] = el;
        }}
        className="flex min-h-[80vh] items-center py-20"
      >
        <div className="mx-auto w-full max-w-xl px-4 md:px-8">
          <ScrollElement direction="up">
            <h2 className="mb-2 text-center text-2xl font-light text-foreground sm:text-3xl">
              This year we crafted
            </h2>
            <p className="mb-10 text-center font-mono text-sm text-muted-foreground">
              Brand identities and visual experiences
            </p>
          </ScrollElement>
          <div className="grid gap-4 sm:grid-cols-2">
            <ScrollElement direction="left" delay={0}>
              <StatCard label="Projects" value={data.metrics.totalProjects} />
            </ScrollElement>
            <ScrollElement direction="right" delay={0.1}>
              <StatCard label="Creative Assets" value={data.metrics.totalAssets} />
            </ScrollElement>
          </div>
        </div>
      </section>

      {/* Assets Section */}
      <section
        ref={(el) => {
          sectionsRef.current[3] = el;
        }}
        className="flex min-h-[80vh] items-center py-20"
      >
        <div className="mx-auto w-full max-w-xl px-4 md:px-8">
          <ScrollElement direction="up">
            <h2 className="mb-2 text-center text-2xl font-light text-foreground sm:text-3xl">
              And we produced
            </h2>
            <p className="mb-10 text-center font-mono text-sm text-muted-foreground">
              Visual content that tells stories
            </p>
          </ScrollElement>
          <div className="grid gap-4 sm:grid-cols-2">
            <ScrollElement direction="left" delay={0}>
              <StatCard label="Images" value={data.metrics.totalImages} />
            </ScrollElement>
            <ScrollElement direction="right" delay={0.1}>
              <StatCard label="Videos" value={data.metrics.totalVideos} />
            </ScrollElement>
          </div>
        </div>
      </section>

      {/* Videos Section */}
      <section
        ref={(el) => {
          sectionsRef.current[4] = el;
        }}
        className="flex min-h-[80vh] items-center py-20"
      >
        <div className="mx-auto w-full max-w-xl px-4 md:px-8">
          <ScrollElement direction="up">
            <h2 className="mb-2 text-center text-2xl font-light text-foreground sm:text-3xl">
              Hours of creativity
            </h2>
            <p className="mb-10 text-center font-mono text-sm text-muted-foreground">
              Time invested in video production
            </p>
          </ScrollElement>
          <ScrollElement direction="up" delay={0.2}>
            <div className="mx-auto max-w-xs">
              <StatCard
                label="Hours of Animation"
                value={Math.round(data.videoEditingMinutes / 60)}
              />
            </div>
          </ScrollElement>
          <ScrollElement direction="up" delay={0.3}>
            <p className="mt-6 text-center font-mono text-xs text-muted-foreground">
              Ese trabajo equivale a estar entre 38 y 50 días seguidos animando sin parar
            </p>
          </ScrollElement>
        </div>
      </section>

      {/* Tools Section */}
      <section
        ref={(el) => {
          sectionsRef.current[5] = el;
        }}
        className="flex min-h-[60vh] items-center py-20"
      >
        <div className="mx-auto w-full max-w-xl px-4 md:px-8">
          <ScrollElement direction="up">
            <h2 className="mb-10 text-center text-2xl font-light text-foreground sm:text-3xl">
              Some of our fav tools
            </h2>
          </ScrollElement>
          <div className="flex flex-col gap-4">
            {/* First row */}
            <div className="grid grid-cols-3 gap-4">
              {data.tools.slice(0, 3).map((tool, i) => (
                <ScrollElement
                  key={tool.name}
                  direction={i % 2 === 0 ? "left" : "right"}
                  delay={i * 0.1}
                >
                  <div className="group relative overflow-visible">
                    <span className="corner-cross top-left" aria-hidden="true" />
                    <span className="corner-cross bottom-right" aria-hidden="true" />
                    <div className="card-border bg-card/20 p-6 flex items-center justify-center aspect-square">
                      <div className="relative h-14 w-14">
                        <Image
                          src={tool.icon}
                          alt={tool.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </ScrollElement>
              ))}
            </div>
            {/* Second row - centered */}
            <div className="flex justify-center">
              <div className="grid grid-cols-3 gap-4 w-full">
                {data.tools.slice(3).map((tool, i) => (
                  <ScrollElement
                    key={tool.name}
                    direction={i % 2 === 0 ? "left" : "right"}
                    delay={0.3 + i * 0.1}
                  >
                    <div className="group relative overflow-visible">
                      <span className="corner-cross top-left" aria-hidden="true" />
                      <span className="corner-cross bottom-right" aria-hidden="true" />
                      <div className="card-border bg-card/20 p-6 flex items-center justify-center aspect-square">
                        <div className="relative h-14 w-14">
                          <Image
                            src={tool.icon}
                            alt={tool.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </ScrollElement>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section
        ref={(el) => {
          sectionsRef.current[6] = el;
        }}
        className="flex min-h-[60vh] items-center py-20"
      >
        <div className="mx-auto w-full max-w-xl px-4 md:px-8">
          <ScrollElement direction="up">
            <h2 className="mb-2 text-center text-2xl font-light text-foreground sm:text-3xl">
              Industries we served
            </h2>
            <p className="mb-10 text-center font-mono text-sm text-muted-foreground">
              Diverse sectors, unique stories
            </p>
          </ScrollElement>
          <ScrollElement direction="up" delay={0.2}>
            <div className="flex flex-wrap justify-center gap-3">
              {data.industries.map((industry, i) => (
                <span
                  key={industry}
                  className="px-4 py-2 text-sm font-medium border border-border/60 text-muted-foreground hover:border-brand-accent/50 hover:text-foreground transition-colors"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {industry}
                </span>
              ))}
            </div>
          </ScrollElement>
        </div>
      </section>

      {/* Countries Section */}
      <section
        ref={(el) => {
          sectionsRef.current[7] = el;
        }}
        className="flex min-h-[60vh] items-center py-20"
      >
        <div className="mx-auto w-full max-w-xl px-4 md:px-8">
          <ScrollElement direction="up">
            <h2 className="mb-2 text-center text-2xl font-light text-foreground sm:text-3xl">
              Countries reached
            </h2>
            <p className="mb-10 text-center font-mono text-sm text-muted-foreground">
              From {data.studio.location} to the world
            </p>
          </ScrollElement>
          <ScrollElement direction="up" delay={0.2}>
            <div className="flex flex-wrap justify-center gap-6">
              {data.countries.map((country, i) => (
                <div
                  key={country.name}
                  className="flex flex-col items-center gap-2"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <span className="text-4xl">{country.flag}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {country.name}
                  </span>
                </div>
              ))}
            </div>
          </ScrollElement>
        </div>
      </section>

      {/* Featured Project Section */}
      {data.featuredProject && (
        <section
          ref={(el) => {
            sectionsRef.current[8] = el;
          }}
          className="flex min-h-[80vh] items-center py-20"
        >
          <div className="mx-auto w-full max-w-xl px-4 md:px-8">
            <ScrollElement direction="up">
              <h2 className="mb-2 text-center text-2xl font-light text-foreground sm:text-3xl">
                Featured project
              </h2>
              <p className="mb-10 text-center font-mono text-sm text-muted-foreground">
                A highlight from our portfolio
              </p>
            </ScrollElement>
            <ScrollElement direction="up" delay={0.2}>
              <Link
                href={`/project/${data.featuredProject.slug}`}
                className="group relative mx-auto block overflow-visible"
              >
                <span className="corner-cross top-left" aria-hidden="true" />
                <span className="corner-cross bottom-right" aria-hidden="true" />
                <div className="card-border relative aspect-video overflow-hidden">
                  <Image
                    src={getBlobUrl(data.featuredProject.thumbnail) || ""}
                    alt={data.featuredProject.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-lg font-semibold text-white">
                      {data.featuredProject.title}
                    </p>
                  </div>
                </div>
              </Link>
            </ScrollElement>
          </div>
        </section>
      )}

      {/* Outro Section */}
      <section
        ref={(el) => {
          sectionsRef.current[9] = el;
        }}
        className="flex min-h-[50vh] items-center py-20"
      >
        <div className="mx-auto w-full max-w-xl px-4 md:px-8">
          <ScrollElement direction="none">
            <div className="text-center">
              <p className="text-4xl font-light text-foreground sm:text-5xl">
                Thank you
              </p>
              <p className="mt-4 text-muted-foreground">
                for being part of our creative journey
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href={data.socialLinks.contact}
                  className="inline-block rounded-full border border-border px-6 py-2 text-sm text-foreground transition-colors hover:bg-muted hover:border-brand-accent/50"
                >
                  Work with us
                </Link>
                <a
                  href={data.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full border border-border px-6 py-2 text-sm text-foreground transition-colors hover:bg-muted hover:border-brand-accent/50"
                >
                  Follow on Instagram
                </a>
              </div>
              <p className="mt-8 font-mono text-xs text-muted-foreground/60">
                Generated on{" "}
                {new Date(data.generatedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </ScrollElement>
        </div>
      </section>
    </>
  );
}

