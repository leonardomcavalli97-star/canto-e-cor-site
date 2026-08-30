"use client";

import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

// Adapted from the aceternity-ui "Sidebar" component, reoriented into a
// horizontal top bar (icon row that reveals all labels together on hover)
// instead of the original vertical side panel. The desktop bar and the
// mobile full-screen menu each own their local state — an earlier version
// shared one "open" flag between them, which meant hovering the desktop bar
// could also trigger the mobile full-screen overlay to cover the page. The
// hover-reveal itself is plain CSS (a `group/bar` on the bar, read by each
// SidebarLink's label) specifically so it needs no shared state at all.

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

export const Sidebar = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const SidebarBody = ({
  mobileHeader,
  className,
  ...props
}: React.ComponentProps<typeof motion.div> & { mobileHeader?: React.ReactNode }) => {
  return (
    <>
      {/* `className` (e.g. "justify-between") is tuned for the desktop bar's
          horizontal layout — the mobile overlay stacks vertically instead
          and gets its own layout classes, so it's deliberately not passed
          down there too. */}
      <DesktopSidebar className={className} {...props} />
      <MobileSidebar mobileHeader={mobileHeader} {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

/** Desktop: a slim horizontal bar. Hovering anywhere on it reveals every label. */
export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  return (
    <motion.div
      className={cn(
        "group/bar hidden md:flex md:flex-row md:items-center md:justify-center gap-8 h-16 w-full bg-background/95 backdrop-blur border-b border-border px-6",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/** Mobile: full-screen menu that slides down from the top bar. Owns its own open/close state. */
export const MobileSidebar = ({
  className,
  children,
  mobileHeader,
  ...props
}: React.ComponentProps<"div"> & { mobileHeader?: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // The header persists across route changes, so tapping a nav link inside
  // the overlay navigates but never closed it on its own — close it whenever
  // the route actually changes. Adjusting state during render (rather than in
  // an effect) avoids an extra commit; see https://react.dev/learn/you-might-not-need-an-effect
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  return (
    <>
      <div
        className={cn(
          "h-14 px-4 flex flex-row md:hidden items-center justify-between bg-background/95 backdrop-blur border-b border-border w-full"
        )}
        {...props}
      >
        {mobileHeader}
        <Menu
          className="text-foreground cursor-pointer"
          onClick={() => setOpen(!open)}
        />
      </div>
      {/* Rendered as a sibling, not a child, of the bar above: that bar uses
          backdrop-blur, and a `backdrop-filter` ancestor creates a new
          containing block for `position: fixed` descendants — nesting this
          overlay inside it trapped it within the bar's own height instead of
          covering the viewport. Also gated with md:hidden so it can never
          show at desktop widths regardless of state. */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn(
              "fixed inset-0 z-[100] flex md:hidden flex-col gap-6 bg-background p-10",
              className
            )}
          >
            <div
              className="absolute top-6 right-6 z-50 cursor-pointer text-foreground"
              onClick={() => setOpen(false)}
            >
              <X />
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/**
 * On desktop the label is collapsed until the bar (`group/bar`, set by
 * DesktopSidebar) is hovered, at which point every link's label reveals at
 * once. On mobile there's no hover, so the label just stays visible in the
 * full-screen menu's vertical list.
 */
export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
  props?: LinkProps;
}) => {
  return (
    <Link
      href={link.href}
      className={cn("flex items-center justify-start gap-2 py-2", className)}
      {...props}
    >
      {link.icon}
      <span
        className="text-sm tracking-wide text-foreground/80 uppercase whitespace-pre transition-all duration-200 md:max-w-0 md:overflow-hidden md:opacity-0 md:group-hover/bar:max-w-[10rem] md:group-hover/bar:opacity-100"
      >
        {link.label}
      </span>
    </Link>
  );
};
