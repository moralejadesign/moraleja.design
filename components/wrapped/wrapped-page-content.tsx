"use client";

import {
  DesktopWrapped,
  ProgressSlider,
  SliderContent,
  SliderWrapper,
  SliderIndicator,
  SliderNavigation,
  IntroSlide,
  StatsSlide,
  SingleStatSlide,
  PartnersSlide,
  ToolsSlide,
  IndustriesSlide,
  CountriesSlide,
  FeaturedProjectSlide,
  FounderSlide,
  ThankYouSlide,
  type WrappedData,
} from "@/components/wrapped";

interface WrappedPageContentProps {
  data: WrappedData;
}

export function WrappedPageContent({ data }: WrappedPageContentProps) {
  return (
    <main className="min-h-screen bg-background dark">
      {/* Mobile Experience */}
      <div className="md:hidden">
        <ProgressSlider
          activeSlider="intro"
          duration={6000}
          className="h-dvh w-full overflow-hidden"
        >
          <SliderIndicator className="fixed top-4 left-4 right-4 z-50" />
          <SliderNavigation className="z-40" />

          <SliderContent>
            <SliderWrapper value="intro">
              <IntroSlide
                studioName={data.studio.name}
                description={data.studio.description}
                year={data.year}
              />
            </SliderWrapper>

            <SliderWrapper value="partners">
              <PartnersSlide projects={data.projects} />
            </SliderWrapper>

            <SliderWrapper value="projects">
              <StatsSlide
                title="This year we crafted"
                subtitle="Brand identities and visual experiences"
                stats={[
                  { label: "Projects", value: data.metrics.totalProjects },
                  { label: "Creative Assets", value: data.metrics.totalAssets },
                ]}
              />
            </SliderWrapper>

            <SliderWrapper value="assets">
              <StatsSlide
                title="And we produced"
                subtitle="Visual content that tells stories"
                stats={[
                  { label: "Images", value: data.metrics.totalImages },
                  { label: "Videos", value: data.metrics.totalVideos },
                ]}
              />
            </SliderWrapper>

            <SliderWrapper value="videos">
              <SingleStatSlide
                title="Hours of creativity"
                subtitle="Time invested in video production"
                value={Math.round(data.videoEditingMinutes / 60)}
                label="Hours of Animation"
                footnote="Ese trabajo equivale a estar entre 38 y 50 días seguidos animando sin parar"
              />
            </SliderWrapper>

            <SliderWrapper value="tools">
              <ToolsSlide tools={data.tools} />
            </SliderWrapper>

            <SliderWrapper value="industries">
              <IndustriesSlide industries={data.industries} />
            </SliderWrapper>

            <SliderWrapper value="countries">
              <CountriesSlide
                countries={data.countries}
                location={data.studio.location}
              />
            </SliderWrapper>

            {data.featuredProject && (
              <SliderWrapper value="featured">
                <FeaturedProjectSlide project={data.featuredProject} />
              </SliderWrapper>
            )}

            <SliderWrapper value="founder">
              <FounderSlide
                name={data.founder.name}
                role={data.founder.role}
                image={data.founder.image}
                quote={data.founder.quote}
              />
            </SliderWrapper>

            <SliderWrapper value="thank-you">
              <ThankYouSlide
                contactUrl={data.socialLinks.contact}
                instagramUrl={data.socialLinks.instagram}
                generatedAt={data.generatedAt}
              />
            </SliderWrapper>
          </SliderContent>
        </ProgressSlider>
      </div>

      {/* Desktop Experience */}
      <div className="hidden md:block">
        <DesktopWrapped data={data} />
      </div>
    </main>
  );
}

