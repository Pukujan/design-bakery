import type { LucideIcon } from "lucide-react";
import { BookOpen, Github, Package } from "lucide-react";

export const PROJECT_GITHUB_URL = "https://github.com/Pukujan/create-modular-monolith";
export const PROJECT_NPM_URL = "https://www.npmjs.com/package/@pukujan/create-modular-monolith";
export const PROJECT_NPM_NAME = "@pukujan/create-modular-monolith";
export const PROJECT_STUDY_BLOG_URL = "https://www.design-bakery.com/endtoend-engineer/blogs/11";

export type ProjectLink = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

export const projectLinks: ProjectLink[] = [
  {
    href: PROJECT_GITHUB_URL,
    label: "GitHub repo",
    shortLabel: "GitHub",
    icon: Github,
  },
  {
    href: PROJECT_NPM_URL,
    label: PROJECT_NPM_NAME,
    shortLabel: "npm",
    icon: Package,
  },
  {
    href: PROJECT_STUDY_BLOG_URL,
    label: "Technical study blog",
    shortLabel: "Study blog",
    icon: BookOpen,
  },
];
