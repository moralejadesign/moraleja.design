import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HomeGrid } from "@/components/home-grid"
import { getAllProjects } from "@/lib/projects"

export const dynamic = "force-dynamic"

export default async function Home() {
  const projects = await getAllProjects()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background pt-16 md:pt-20">
        <HomeGrid projects={projects} />
      </main>
      <Footer />
    </div>
  )
}
