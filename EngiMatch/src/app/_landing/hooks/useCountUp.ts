"use client";

import { useState, useEffect, useRef } from "react";
import { useReducedMotion } from "./useReducedMotion";

/**
 * Count-up animation with IntersectionObserver trigger.
 * Respects prefers-reduced-motion.
 */
export function useCountUp(target: number, duration = 1500, delay = 0) {
  const [value, setValue] = useState(0);
  const hasRun = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (hasRun.current) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        hasRun.current = true;
        io.unobserve(el);

        if (reduced) {
          setValue(target);
          return;
        }

        setTimeout(() => {
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(Math.round(eased * target));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }, delay);
      }
    }, { threshold: 0.3 });

    io.observe(el);
    return () => io.disconnect();
  }, [target, duration, delay, reduced]);

  return { ref, value };
}
