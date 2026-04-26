"use client";

import { useCountUp } from "../hooks/useCountUp";

export function AnimatedStat({ value, label }: { value: string; label: string }) {
  const numeric = parseInt(value.replace(/\D/g, ""), 10) || 0;
  const suffix = value.replace(/[\d]/g, "");
  const { ref, value: animated } = useCountUp(numeric, 1800);

  return (
    <div className="flex flex-col items-center text-center">
      <span ref={ref} className="text-4xl font-bold tracking-tight text-white md:text-5xl">
        {animated}{suffix}
      </span>
      <span className="mt-2 text-sm text-white/50">{label}</span>
    </div>
  );
}
