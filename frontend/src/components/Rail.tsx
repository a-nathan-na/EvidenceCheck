import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RailProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * The page's only structural primitive: a fixed-width label rail on the left,
 * content filling the rest. Every field and every result row uses it, which is
 * what makes the off-centre composition read as a system rather than an
 * accident. Rows are separated by a hairline, never boxed.
 */
export const Rail = ({ label, children, className }: RailProps) => (
  <div
    className={cn("grid gap-x-8 gap-y-3 border-t border-border py-7 sm:grid-cols-rail", className)}
  >
    <div className="text-[11px] font-medium uppercase leading-5 tracking-[0.14em] text-muted-foreground">
      {label}
    </div>
    <div className="min-w-0">{children}</div>
  </div>
);
