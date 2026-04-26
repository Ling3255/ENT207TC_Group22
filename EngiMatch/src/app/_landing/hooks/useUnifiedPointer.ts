"use client";

import { useEffect, useRef, useCallback } from "react";

interface PointerState {
  x: number;
  y: number;
  normalizedX: number; // -1 to 1
  normalizedY: number; // -1 to 1
}

const subscribers = new Set<(state: PointerState) => void>();
let globalRaf = 0;
let globalListenerAdded = false;

const current = { x: 0, y: 0, nx: 0, ny: 0 };

function onPointerMove(e: PointerEvent) {
  current.x = e.clientX;
  current.y = e.clientY;
  current.nx = (e.clientX / window.innerWidth - 0.5) * 2;
  current.ny = (e.clientY / window.innerHeight - 0.5) * 2;
}

function tick() {
  const state: PointerState = {
    x: current.x,
    y: current.y,
    normalizedX: current.nx,
    normalizedY: current.ny,
  };
  subscribers.forEach((cb) => cb(state));
  globalRaf = requestAnimationFrame(tick);
}

function startGlobal() {
  if (globalListenerAdded) return;
  globalListenerAdded = true;
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  globalRaf = requestAnimationFrame(tick);
}

function stopGlobal() {
  if (subscribers.size > 0) return;
  globalListenerAdded = false;
  window.removeEventListener("pointermove", onPointerMove);
  cancelAnimationFrame(globalRaf);
}

/**
 * Unified pointer tracking: ONE global pointermove listener + ONE rAF loop.
 * All consumers subscribe via callback ref — no React re-renders on move.
 */
export function useUnifiedPointer(
  callback: (state: PointerState) => void,
  enabled = true
) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const wrapper = (state: PointerState) => cbRef.current(state);
    subscribers.add(wrapper);
    startGlobal();

    return () => {
      subscribers.delete(wrapper);
      stopGlobal();
    };
  }, [enabled]);
}

/** Hook to imperatively read latest pointer state (no re-renders). */
export function usePointerRef(enabled = true) {
  const ref = useRef<PointerState>({ x: 0, y: 0, normalizedX: 0, normalizedY: 0 });

  useUnifiedPointer(
    useCallback((s) => {
      ref.current = s;
    }, []),
    enabled
  );

  return ref;
}
