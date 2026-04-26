"use client";

import { useState, useEffect } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const top = doc.scrollTop || document.body.scrollTop;
      const height = doc.scrollHeight - doc.clientHeight;
      setProgress(height > 0 ? (top / height) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed left-0 top-0 z-[60] h-[2px] w-full bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-emerald-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
        style={{
          width: `${progress}%`,
          transition: reduced ? "width 0.3s ease-out" : "width 0.1s linear",
        }}
      />
    </div>
  );
}
