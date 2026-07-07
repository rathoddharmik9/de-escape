"use client";

import { cn } from "@/lib/utils";

interface ButtonSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * A circular spinner designed for inline use inside buttons.
 * Uses the brand gradient (green → lime) for the spinning arc.
 */
export default function ButtonSpinner({ className, size = "md" }: ButtonSpinnerProps) {
  const sizeMap = { sm: 14, md: 16, lg: 20 };
  const px = sizeMap[size];

  return (
    <svg
      className={cn("animate-spin", className)}
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
