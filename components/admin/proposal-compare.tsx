"use client";

/* eslint-disable @next/next/no-img-element -- slide images from the Blob store */
import { useState } from "react";
import { roundLabel, type ProposalWithRounds } from "@/lib/proposals";

/** Two rounds side by side, slide by slide, with how many threads each slide got. */
export function ProposalCompare({ proposal }: { proposal: ProposalWithRounds }) {
  const rounds = proposal.versions.filter((v) => v.slides.length > 0);
  const [leftId, setLeftId] = useState(rounds.at(-2)?.id ?? rounds[0]?.id);
  const [rightId, setRightId] = useState(rounds.at(-1)?.id);
  const left = rounds.find((r) => r.id === leftId);
  const right = rounds.find((r) => r.id === rightId);

  if (rounds.length < 2) {
    return <p className="py-12 text-center text-muted-foreground">Two rounds with slides are needed to compare.</p>;
  }

  const threads = (versionId: number, slideId: string) =>
    proposal.comments.filter((c) => c.versionId === versionId && c.slideId === slideId && !c.parentId).length;
  const rows = Math.max(left?.slides.length ?? 0, right?.slides.length ?? 0);

  const picker = (value: number | undefined, onChange: (id: number) => void) => (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="px-2 py-1.5 text-sm bg-background border border-border"
    >
      {rounds.map((r) => (
        <option key={r.id} value={r.id}>
          {roundLabel(r.number)}
        </option>
      ))}
    </select>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-6">
        <div>{picker(leftId, setLeftId)}</div>
        <div>{picker(rightId, setRightId)}</div>
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="grid grid-cols-2 gap-6">
          {[left, right].map((round, side) => {
            const slide = round?.slides[i];
            if (!round || !slide) return <div key={side} className="border border-dashed border-border" />;
            const n = threads(round.id, slide.id);
            return (
              <figure key={side} className="space-y-1.5">
                <div className="relative bg-muted/30" style={{ aspectRatio: `${slide.width} / ${slide.height}` }}>
                  <img src={slide.url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-contain" />
                </div>
                <figcaption className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {roundLabel(round.number)} · {i + 1}
                    {slide.title && ` · ${slide.title}`}
                  </span>
                  {n > 0 && <span>{n} {n === 1 ? "comment" : "comments"}</span>}
                </figcaption>
              </figure>
            );
          })}
        </div>
      ))}
    </div>
  );
}
