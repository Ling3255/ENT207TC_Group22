"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "./useReducedMotion";

/**
 * Staggered reveal animation via IntersectionObserver.
 * Safe to call at component top level (not inline in JSX).
 * Respects prefers-reduced-motion.
 */
export function useStaggerReveal<T extends HTMLElement>(
  itemSelector: string,
  staggerMs = 80
) {
  const containerRef = useRef<T>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll<HTMLElement>(itemSelector);

    items.forEach((item) => {
      item.style.opacity = reduced ? "1" : "0";
      item.style.transform = reduced ? "translateY(0)" : "translateY(24px)";
      item.style.transition = `opacity 0.6s ease, transform 0.6s ease`;
    });

    if (reduced) return;

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        items.forEach((item, i) => {
          setTimeout(() => {
            item.style.opacity = "1";
            item.style.transform = "translateY(0)";
          }, i * staggerMs);
        });
        io.unobserve(container);
      }
    }, { threshold: 0.1 });

    io.observe(container);
    return () => io.disconnect();
  }, [itemSelector, staggerMs, reduced]);

  return containerRef;
}
