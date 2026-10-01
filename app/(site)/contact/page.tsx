import { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { CalBookingButton } from "@/components/cal-booking-button";
import { ArrowUpRight, Mail } from "lucide-react";
import { socialLinks, email } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Moraleja Design. Let's create something meaningful together.",
};

export default function ContactPage() {
  return (
    <>
      <PageIntro
        name="Let's create"
        statement="something meaningful together."
        lede="Tell us about your brand, your project or your idea."
      />

      {/* Contact Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Email */}
        <div className="group relative">
          <span className="corner-cross top-left" aria-hidden="true" />
          <span className="corner-cross bottom-right" aria-hidden="true" />
          
          <a
            href={`mailto:${email}`}
            className="card-border block p-6 md:p-8 transition-colors hover:border-foreground/30 h-full rounded-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-muted-foreground/60 mb-3">
                  email
                </p>
                <p className="text-lg md:text-xl font-medium tracking-tight">
                  {email}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  For inquiries and collaborations
                </p>
              </div>
              <div className="flex-shrink-0 p-2 border border-border/60 text-muted-foreground group-hover:border-foreground/30 group-hover:text-foreground transition-colors">
                <Mail className="h-5 w-5" />
              </div>
            </div>
          </a>
        </div>

        {/* Cal Booking */}
        <div className="group relative">
          <span className="corner-cross top-left" aria-hidden="true" />
          <span className="corner-cross bottom-right" aria-hidden="true" />
          <CalBookingButton />
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-1">
        <p className="font-mono text-xs text-muted-foreground/60 mb-4">
          connect
        </p>
        
        {socialLinks.map((link, index) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between py-4 border-b border-border/40 hover:border-foreground/20 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-muted-foreground/40 w-6">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-medium">{link.name}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
              <span className="text-sm hidden sm:inline">{link.handle}</span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </a>
        ))}
      </div>

      {/* Bottom note */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border/40" />
        <span className="font-mono text-xs text-muted-foreground/50">
          Based in Colombia
        </span>
        <span className="h-px flex-1 bg-border/40" />
      </div>
    </>
  );
}

