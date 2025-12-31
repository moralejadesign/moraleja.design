"use client";

import { motion } from "framer-motion";

interface CountriesSlideProps {
  countries: Array<{ name: string; flag: string }>;
  location: string;
}

export function CountriesSlide({ countries, location }: CountriesSlideProps) {
  return (
    <div className="relative flex h-dvh flex-col items-center justify-center px-6 pt-16 pb-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-accent/5 via-transparent to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-light text-foreground">Countries reached</h2>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          From {location} to the world
        </p>
      </motion.div>

      <div className="flex flex-wrap justify-center gap-6">
        {countries.map((country, index) => (
          <motion.div
            key={country.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-4xl">{country.flag}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {country.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

