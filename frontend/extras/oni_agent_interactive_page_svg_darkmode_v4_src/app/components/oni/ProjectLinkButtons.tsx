import React from "react";
import { ExternalLink } from "lucide-react";
import { projectLinks, type ProjectLink } from "./projectLinks";

type ProjectLinkButtonsProps = {
  className?: string;
  size?: "sm" | "md";
  variant?: "default" | "accent";
  showExternalIcon?: boolean;
  labelMode?: "full" | "short";
  /** Keep pills on one line for horizontal scroll regions (navbar). */
  nowrap?: boolean;
  /** Drop shadow/ring — use in overflow scroll rows so pills are not clipped. */
  elevated?: boolean;
};

function linkClassName(size: "sm" | "md", variant: "default" | "accent", elevated: boolean) {
  const padding = size === "md" ? "px-4 py-2.5 text-sm" : "px-3 py-2 text-xs";
  const elevation = elevated ? "shadow-sm ring-1" : "";
  const base = `inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border font-bold transition hover:opacity-90 ${padding} ${elevation}`;
  if (variant === "accent") {
    return `${base} oni-nav-active border-transparent`;
  }
  return `${base} oni-btn`;
}

export function ProjectLinkButtons({
  className = "",
  size = "sm",
  variant = "default",
  showExternalIcon = true,
  labelMode = "full",
  nowrap = false,
  elevated = true,
}: ProjectLinkButtonsProps) {
  return (
    <div className={`flex items-center gap-2 ${nowrap ? "flex-nowrap" : "flex-wrap"} ${className}`}>
      {projectLinks.map((link) => (
        <ProjectLinkButton
          key={link.href}
          link={link}
          size={size}
          variant={variant}
          showExternalIcon={showExternalIcon}
          labelMode={labelMode}
          elevated={elevated}
        />
      ))}
    </div>
  );
}

function ProjectLinkButton({
  link,
  size,
  variant,
  showExternalIcon,
  labelMode,
  elevated,
}: {
  link: ProjectLink;
  size: "sm" | "md";
  variant: "default" | "accent";
  showExternalIcon: boolean;
  labelMode: "full" | "short";
  elevated: boolean;
}) {
  const Icon = link.icon;
  const label = labelMode === "short" ? link.shortLabel : link.label;
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer"
      className={linkClassName(size, variant, elevated)}
      title={link.label}
    >
      <Icon className={size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"} aria-hidden />
      <span>{label}</span>
      {showExternalIcon ? <ExternalLink className="h-3 w-3 opacity-70" aria-hidden /> : null}
    </a>
  );
}
