import { Calendar } from "lucide-react";

export function CalBookingButton() {
  return (
    <a
      href="https://cal.com/moraleja/15min"
      target="_blank"
      rel="noopener noreferrer"
      className="card-border block w-full h-full p-6 md:p-8 text-left transition-colors hover:border-foreground/30"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-muted-foreground/60 mb-3">
            schedule
          </p>
          <p className="text-lg md:text-xl font-medium tracking-tight">
            Book a call
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            15 min intro call to discuss your project
          </p>
        </div>
        <div className="flex-shrink-0 p-2 border border-border/60 text-muted-foreground group-hover:border-foreground/30 group-hover:text-foreground transition-colors">
          <Calendar className="h-5 w-5" />
        </div>
      </div>
    </a>
  );
}
