"use client";

import { usePathname } from "next/navigation";
import LanguageSwitcher from "@/context/LanguageSwitcher";

/**
 * Hides the global language switcher on the landing page (/)
 * because LandingPage renders its own dark-variant switcher in the header.
 */
export default function GlobalLanguageSwitcher() {
  const pathname = usePathname();

  // Hide on landing page — it has its own integrated switcher
  if (pathname === "/") return null;

  return (
    <div className="fixed top-4 right-4 z-[70]">
      <LanguageSwitcher variant="light" />
    </div>
  );
}
