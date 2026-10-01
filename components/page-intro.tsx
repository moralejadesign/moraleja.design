interface PageIntroProps {
  /** Lead-in of the headline, e.g. "Moraleja" or "Gallery". */
  name: string
  statement?: string
  lede?: string
  /** Home-page sized headline. */
  large?: boolean
  children?: React.ReactNode
}

export function PageIntro({ name, statement, lede, large, children }: PageIntroProps) {
  return (
    <section className="flex flex-col items-start gap-3">
      <h1
        className={`leading-[1.1] text-foreground ${
          large
            ? "text-[40px] tracking-[-1px] md:text-[56px] xl:text-[64px]"
            : "text-[32px] tracking-[-0.4px] md:text-[40px]"
        }`}
      >
        {name}
        {statement && <> {statement}</>}
      </h1>
      {lede && <p className="font-light tracking-[0.16px] text-muted-foreground">{lede}</p>}
      {children}
    </section>
  )
}

export function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-[28px] leading-[1.1] tracking-[-0.4px] md:text-[32px]">
      {children}
    </h2>
  )
}
