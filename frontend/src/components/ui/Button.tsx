"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark disabled:bg-blue-300 dark:disabled:bg-blue-900",
  secondary:
    "bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:text-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:disabled:text-gray-500",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100 disabled:text-gray-400 dark:text-gray-300 dark:hover:bg-gray-800 dark:disabled:text-gray-600",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className = "", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
});
