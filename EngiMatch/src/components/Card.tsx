import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  href?: string;
  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
}

export function Card({
  children,
  className = "",
  href,
  gradient = false,
  gradientFrom = "from-[#c39a62]",
  gradientTo = "to-[#a97848]",
}: CardProps) {
  const base =
    "rounded-2xl shadow-sm border transition-all hover:shadow-md focus:ring-4";

  const normal = "bg-white border-[#e8ddd0] hover:border-[#d8c2a0] focus:ring-[#e7d8c0]";
  const grad = `bg-gradient-to-br ${gradientFrom} ${gradientTo} border-[#dfc7a4] text-white focus:ring-[#e7d8c0]`;

  const classes = `${base} ${gradient ? grad : normal} ${className}`;

  if (href) {
    return (
      <a href={href} className={`${classes} flex flex-col items-center gap-2 p-6`}>
        {children}
      </a>
    );
  }

  return <div className={classes}>{children}</div>;
}
