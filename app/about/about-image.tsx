"use client";

import Image from "next/image";
import { useState } from "react";
import founderImage from "@/public/about/founder.jpg";

export function AboutImage() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      <Image
        src={founderImage}
        alt="Aleja, founder of Moraleja Design"
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        quality={85}
        priority
        placeholder="blur"
        className={`object-cover transition-all duration-500 group-hover:scale-105 ${
          isLoaded ? "opacity-100" : "opacity-90"
        }`}
        onLoad={() => setIsLoaded(true)}
      />
    </>
  );
}
