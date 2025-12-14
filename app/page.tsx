import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MasonryGrid } from "@/components/masonry-grid"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background pt-16 md:pt-20">
        <MasonryGrid />
      </main>
      <Footer />
    </div>
  )
}
