"use client";

import { useEffect, useRef, useState } from "react";
import { useUnifiedPointer } from "../hooks/useUnifiedPointer";
import { useIsTouchDevice } from "../hooks/useIsTouchDevice";
import { useReducedMotion } from "../hooks/useReducedMotion";

/**
 * Custom cursor: only enabled on non-touch devices.
 * Uses unified pointer tracker (no extra global listeners).
 */
export function CustomCursor() {
  const isTouch = useIsTouchDevice();
  const reduced = useReducedMotion();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  // Only run effect on desktop and when motion is allowed
  const enabled = !isTouch && !reduced;

  useUnifiedPointer((state) => {
    target.current = { x: state.x, y: state.y };
    if (dotRef.current) {
      dotRef.current.style.transform = `translate(${state.x - 3}px, ${state.y - 3}px)`;
    }
  }, enabled);

  useEffect(() => {
    if (!enabled) return;

    let raf = 0;
    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.15;
      pos.current.y += (target.current.y - pos.current.y) * 0.15;
      if (ringRef.current) {
        const size = hovering ? 24 : 16;
        ringRef.current.style.transform = `translate(${pos.current.x - size}px, ${pos.current.y - size}px)`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("a, button, [role='button'], input, textarea, select, label, .cursor-hover")) {
        setHovering(true);
      }
    };
    const onOut = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("a, button, [role='button'], input, textarea, select, label, .cursor-hover")) {
        setHovering(false);
      }
    };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      cancelAnimationFrame(raf);
    };
  }, [enabled, hovering]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-[6px] w-[6px] rounded-full bg-white mix-blend-difference will-change-transform"
        style={{ transition: "width 0.2s, height 0.2s" }}
      />
      <div
        ref={ringRef}
        className={`pointer-events-none fixed left-0 top-0 z-[9998] rounded-full border border-white/60 mix-blend-difference will-change-transform transition-all duration-300 ${
          hovering ? "h-12 w-12 border-white/30 bg-white/5" : "h-8 w-8"
        }`}
      />
    </>
  );
}
