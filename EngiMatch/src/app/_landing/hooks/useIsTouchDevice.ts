"use client";

import { useState, useEffect } from "react";

/**
 * Detects if the primary input is a coarse pointer (touch device).
 * Used to disable mouse-centric effects like custom cursor, parallax, tilt.
 */
export function useIsTouchDevice(): boolean {
  // Default to true (touch) on SSR to avoid rendering mouse-only effects server-side
  const [isTouch, setIsTouch] = useState(true);

  useEffect(() => {
    const detect = () => {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const touchPoints = "maxTouchPoints" in navigator && navigator.maxTouchPoints > 0;
      setIsTouch(coarse || touchPoints);
    };
    detect();
    // Re-check on resize in case of device rotation or hybrid devices
    window.addEventListener("resize", detect);
    return () => window.removeEventListener("resize", detect);
  }, []);

  return isTouch;
}
