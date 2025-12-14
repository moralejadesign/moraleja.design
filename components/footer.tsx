export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-8 md:px-8 lg:px-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Moraleja
          </p>

          <div className="flex items-center gap-6">
            <a
              href="https://x.com/moraleja_design"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              X
            </a>
            <a
              href="https://github.com/moralejadesign"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              GitHub
            </a>
            <a
              href="https://www.instagram.com/alejandramoralesgarzon_/"
                    target="_blank"
                    rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Instagram
                  </a>
                  <a
              href="https://www.linkedin.com/in/alejamorales/"
                    target="_blank"
                    rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    LinkedIn
                  </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
