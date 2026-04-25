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
  gradientFrom = "from-indigo-600",
  gradientTo = "to-violet-600",
}: CardProps) {
  const base =
    "rounded-2xl shadow-sm border transition-all hover:shadow-md focus:ring-4";

  const normal = "bg-white border-slate-200 hover:border-indigo-200 focus:ring-indigo-300";
  const grad = `bg-gradient-to-br ${gradientFrom} ${gradientTo} border-indigo-200 text-white focus:ring-indigo-300`;

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
