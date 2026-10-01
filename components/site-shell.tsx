import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { Footer } from "./footer"

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="mx-auto max-w-[1440px] px-[23px] md:px-[37px] lg:grid lg:grid-cols-[0.36fr_1fr] lg:gap-x-[74px] lg:px-[46px]">
        <Sidebar />
        <main className="flex w-full min-w-0 max-w-[960px] flex-col gap-[55px] justify-self-end pt-[calc(var(--header-height)+46px)] pb-[74px] lg:pt-[calc(var(--header-height)+64px)]">
          {children}
          <Footer />
        </main>
      </div>
    </>
  )
}
