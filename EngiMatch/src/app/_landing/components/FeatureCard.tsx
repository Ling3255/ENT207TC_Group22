"use client";

import { useRef, useEffect } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useIsTouchDevice } from "../hooks/useIsTouchDevice";

interface FeatureCardData {
  index: string;
  eyebrowEn: string;
  eyebrowZh: string;
  titleEn: string;
  titleZh: string;
  bodyEn: string;
  bodyZh: string;
  icon: React.ReactNode;
}

export function FeatureCard({ card, isEn }: { card: FeatureCardData; isEn: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const isTouch = useIsTouchDevice();

  /* Spotlight tracking — disabled on touch and reduced-motion */
  useEffect(() => {
    if (reduced || isTouch) return;
    const el = cardRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty("--spotlight-x", `${x}px`);
      el.style.setProperty("--spotlight-y", `${y}px`);
    };
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, [reduced, isTouch]);

  return (
    <article
      ref={cardRef}
      className="feature-card group relative cursor-hover overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
      style={{
        background: `radial-gradient(600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(34,211,238,0.07), transparent 40%)`,
      }}
    >
      {/* Glow border on hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[1.8rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(103,232,249,0.15), transparent 50%)`,
        }}
      />
      {/* Animated gradient border */}
      <div
        className="pointer-events-none absolute -inset-[1px] rounded-[1.82rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `conic-gradient(from 180deg at 50% 50%, rgba(103,232,249,0.3) 0deg, rgba(232,121,249,0.3) 120deg, rgba(52,211,153,0.3) 240deg, rgba(103,232,249,0.3) 360deg)`,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          padding: "1px",
        }}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/30">{card.index}</div>
          <div className="rounded-full border border-white/10 bg-white/[0.05] p-2.5 text-cyan-300/70 transition-all duration-300 group-hover:border-cyan-300/30 group-hover:bg-cyan-300/10 group-hover:text-cyan-300 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]">
            {card.icon}
          </div>
        </div>
        <div className="mt-5 text-[11px] font-medium uppercase tracking-[0.2em] text-cyan-300/70">
          {isEn ? card.eyebrowEn : card.eyebrowZh}
        </div>
        <h3 className="mt-3 text-xl font-semibold leading-snug tracking-[-0.01em] text-white">
          {isEn ? card.titleEn : card.titleZh}
        </h3>
        <p className="mt-4 text-sm leading-7 text-white/55">{isEn ? card.bodyEn : card.bodyZh}</p>
      </div>
    </article>
  );
}
