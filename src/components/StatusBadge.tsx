import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "accent";

const toneStyles: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]",
  warning: "bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))]",
  danger: "bg-[hsl(var(--danger)/0.12)] text-[hsl(var(--danger))]",
  accent: "bg-[hsl(var(--accent)/0.12)] text-[hsl(var(--accent))]",
};

const dotStyles: Record<Tone, string> = {
  neutral: "bg-muted-foreground/60",
  success: "bg-[hsl(var(--success))]",
  warning: "bg-[hsl(var(--warning))]",
  danger: "bg-[hsl(var(--danger))]",
  accent: "bg-[hsl(var(--accent))]",
};

export function StatusBadge({
  tone = "neutral",
  children,
  withDot = true,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  withDot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide",
        toneStyles[tone],
        className,
      )}
    >
      {withDot && <span className={cn("h-1.5 w-1.5 rounded-full", dotStyles[tone])} />}
      {children}
    </span>
  );
}
