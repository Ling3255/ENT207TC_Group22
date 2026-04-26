"use client";

import { useRef, useEffect } from "react";
import { useUnifiedPointer } from "../hooks/useUnifiedPointer";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useIsTouchDevice } from "../hooks/useIsTouchDevice";

export function ParallaxBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const isTouch = useIsTouchDevice();

  // Parallax layers — disabled on touch / reduced-motion
  useUnifiedPointer((state) => {
    if (reduced || isTouch) return;
    const container = containerRef.current;
    if (!container) return;
    const layers = container.querySelectorAll<HTMLElement>("[data-parallax]");
    layers.forEach((layer) => {
      const fx = Number(layer.dataset.px || 0);
      const fy = Number(layer.dataset.py || 0);
      layer.style.transform = `translate(${state.normalizedX * fx}px, ${state.normalizedY * fy}px)`;
    });
  }, true);

  // Mouse spotlight — disabled on touch / reduced-motion
  useUnifiedPointer((state) => {
    if (reduced || isTouch) return;
    const el = spotlightRef.current;
    if (!el) return;
    el.style.background = `radial-gradient(600px circle at ${state.x}px ${state.y}px, rgba(34,211,238,0.07), transparent 40%)`;
  }, true);

  // Pre-set spotlight to center on mount (avoids blank frame)
  useEffect(() => {
    const el = spotlightRef.current;
    if (!el) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    el.style.background = `radial-gradient(600px circle at ${cx}px ${cy}px, rgba(34,211,238,0.07), transparent 40%)`;
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        data-parallax data-px="28" data-py="22"
        className="absolute left-[-10%] top-[-10%] h-[38rem] w-[38rem] rounded-full bg-cyan-400/10 blur-3xl will-change-transform"
      />
      <div
        data-parallax data-px="-24" data-py="-16"
        className="absolute right-[-8%] top-[12%] h-[34rem] w-[34rem] rounded-full bg-fuchsia-500/08 blur-3xl will-change-transform"
      />
      <div
        data-parallax data-px="18" data-py="-20"
        className="absolute bottom-[-12%] left-[20%] h-[28rem] w-[28rem] rounded-full bg-emerald-400/08 blur-3xl will-change-transform"
      />
      {/* Global mouse spotlight */}
      <div ref={spotlightRef} className="absolute inset-0 transition-[background] duration-100" />
      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_45%),linear-gradient(180deg,rgba(7,10,24,0.25),rgba(5,8,22,0.97))]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:80px_80px]" />
    </div>
  );
}
