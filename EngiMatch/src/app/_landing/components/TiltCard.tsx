"use client";

import { useRef, useEffect } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useIsTouchDevice } from "../hooks/useIsTouchDevice";

export function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const isTouch = useIsTouchDevice();

  useEffect(() => {
    if (reduced || isTouch) return;
    const el = ref.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(800px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
    };
    const onLeave = () => {
      el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced, isTouch]);

  return (
    <div
      ref={ref}
      className={`transition-transform duration-200 ease-out will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}
