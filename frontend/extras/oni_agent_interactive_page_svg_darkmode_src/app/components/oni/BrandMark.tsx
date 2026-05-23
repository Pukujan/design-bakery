import React from "react";

const PRESETS = {
  icon: "h-10 w-10 rounded-2xl",
  chip: "h-7 w-7 rounded-full",
  accent: "h-20 w-20 rounded-3xl",
  feature: "h-24 w-24 rounded-[1.5rem]",
  footer: "h-16 w-16 rounded-[1.4rem]",
  hero: "h-48 w-full rounded-3xl",
  decor: "h-32 w-32",
} as const;

type BrandMarkPreset = keyof typeof PRESETS;

type BrandMarkProps = {
  src: string;
  alt: string;
  preset?: BrandMarkPreset;
  className?: string;
  frameClassName?: string;
};

export function BrandMark({
  src,
  alt,
  preset = "icon",
  className = "",
  frameClassName = "",
}: BrandMarkProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${PRESETS[preset]} ${frameClassName}`}
      aria-hidden={alt === "" ? true : undefined}
    >
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-contain object-center ${className}`}
        draggable={false}
      />
    </span>
  );
}
