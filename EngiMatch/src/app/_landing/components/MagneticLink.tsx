"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useIsTouchDevice } from "../hooks/useIsTouchDevice";

export function MagneticLink({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const isTouch = useIsTouchDevice();

  /* Magnetic effect — disabled on touch and reduced-motion */
  useEffect(() => {
    if (reduced || isTouch) return;
    const el = ref.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    };
    const onLeave = () => {
      el.style.transform = "translate(0,0)";
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced, isTouch]);

  /* Click ripple */
  const onClick = (e: React.MouseEvent) => {
    const el = ref.current;
    const ripple = rippleRef.current;
    if (!el || !ripple) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.transform = "translate(-50%, -50%) scale(0)";
    ripple.style.opacity = "0.4";
    requestAnimationFrame(() => {
      ripple.style.transition = "transform 0.5s ease-out, opacity 0.5s ease-out";
      ripple.style.transform = "translate(-50%, -50%) scale(4)";
      ripple.style.opacity = "0";
    });
    setTimeout(() => {
      ripple.style.transition = "none";
      ripple.style.transform = "translate(-50%, -50%) scale(0)";
    }, 500);
  };

  const baseClasses = primary
    ? "group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition-shadow hover:shadow-[0_0_40px_rgba(255,255,255,0.18)] cursor-hover"
    : "relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm uppercase tracking-[0.18em] text-white/75 transition-all hover:border-white/30 hover:bg-white/[0.08] hover:text-white hover:shadow-[0_0_30px_rgba(255,255,255,0.06)] cursor-hover";

  return (
    <Link
      ref={ref}
      href={href}
      onClick={onClick}
      className={baseClasses}
    >
      <span className="relative z-10">{children}</span>
      {primary && (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-cyan-200 via-white to-fuchsia-200 transition-transform duration-500 group-hover:translate-x-0" />
      )}
      <span
        ref={rippleRef}
        className="pointer-events-none absolute h-20 w-20 rounded-full bg-white/30"
        style={{ transform: "translate(-50%, -50%) scale(0)" }}
      />
    </Link>
  );
}
