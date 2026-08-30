import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

const base =
  "inline-flex items-center justify-center gap-2 px-7 py-3 text-sm tracking-wide uppercase transition-colors";

const variants = {
  solid: "bg-accent text-white hover:bg-accent-dark",
  outline: "border border-accent text-accent hover:bg-accent hover:text-white",
};

export function LinkButton({
  href,
  variant = "solid",
  className = "",
  children,
}: {
  href: string;
  variant?: keyof typeof variants;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "solid",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
