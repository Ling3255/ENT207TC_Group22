"use client";

import { useState, useEffect } from "react";
import { useReducedMotion } from "./useReducedMotion";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

/**
 * Text scramble effect with reduced-motion support.
 * When reduced motion is preferred, text appears instantly after delay.
 */
export function useTextScramble(text: string, delay = 0) {
  const [display, setDisplay] = useState("");
  const reduced = useReducedMotion();

  useEffect(() => {
    const totalFrames = text.length * 4;
    let frame = 0;
    let raf = 0;

    setDisplay("");

    const timeout = setTimeout(() => {
      if (reduced) {
        // Skip animation for accessibility
        setDisplay(text);
        return;
      }

      const tick = () => {
        frame++;
        const revealCount = Math.floor((frame / totalFrames) * text.length);
        let out = "";
        for (let i = 0; i < text.length; i++) {
          if (text[i] === " " || text[i] === "\n" || text[i] === "\r") {
            out += text[i];
          } else if (i < revealCount) {
            out += text[i];
          } else if (i < revealCount + 3) {
            out += CHARS[Math.floor(Math.random() * CHARS.length)];
          } else {
            out += "\u00A0";
          }
        }
        setDisplay(out);
        if (frame < totalFrames) raf = requestAnimationFrame(tick);
        else setDisplay(text);
      };
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [text, delay, reduced]);

  return display;
}
