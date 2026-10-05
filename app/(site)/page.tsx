import Link from "next/link"
import { HomeGrid } from "@/components/home-grid"
import { PageIntro, SectionTitle } from "@/components/page-intro"
import { Showreel } from "@/components/showreel"
import { getAllProjects } from "@/lib/projects"
import { showreel } from "@/lib/site"

export default async function Home() {
  const projects = await getAllProjects()

  return (
    <>
      <PageIntro
        large
        name="The studio behind brands that can't be ignored."
        lede="We build identities for tech startups and sharpen their visual communication, so their brand is impossible to overlook."
      >
        <Showreel items={[{ src: showreel }]} />
      </PageIntro>

      <SectionTitle id="work">selected work:</SectionTitle>
      <section aria-labelledby="work" className="flex flex-col gap-5">
        <HomeGrid projects={projects} />
        <Link
          href="/gallery"
          className="flex w-full items-center justify-center rounded-lg bg-secondary px-6 py-2.5 text-sm tracking-[0.14px] ring-4 ring-brand-accent/10 transition-colors hover:bg-brand-accent hover:text-black"
        >
          Browse the gallery
        </Link>
      </section>
    </>
  )
}
