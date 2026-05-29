import { useState } from "react";
import type { UxVisualSlot } from "./ekagajpatraUxAssets";
import { resolveUxVisual } from "./ekagajpatraUxAssets";

type CaseStudyImageProps = {
  slot: UxVisualSlot;
  alt: string;
  className?: string;
};

function WireframeMock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`min-h-[245px] rounded-2xl border border-gray-200 bg-white p-5 grid gap-2.5 content-start ${className}`}
      role="img"
      aria-label="Prototype wireframe placeholder"
    >
      <div className="h-4 w-1/2 rounded-md bg-gray-200" />
      <div className="h-5 w-[88%] rounded-lg border border-gray-200 bg-gray-50" />
      <div className="h-5 w-full rounded-lg border border-gray-200 bg-gray-50" />
      <div className="h-5 w-[98%] rounded-lg border border-gray-200 bg-gray-50" />
      <div className="h-9 w-[118px] rounded-lg bg-primary mt-3" />
    </div>
  );
}

function ScreenshotPlaceholder({
  slot,
  className = "",
}: {
  slot: UxVisualSlot;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white p-8 min-h-[245px] text-center text-gray-600 ${className}`}
      role="img"
      aria-label={`Screenshot slot: ${slot.fallbackLabel}`}
    >
      <div>
        <p className="font-bold text-primary mb-1">
          {slot.placeholderTitle ?? "Screenshot slot"}
        </p>
        {slot.placeholderHint ? (
          <p className="text-sm text-gray-600">{slot.placeholderHint}</p>
        ) : null}
        <code className="inline-block mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 break-all">
          {slot.fallbackLabel}
        </code>
      </div>
    </div>
  );
}

export function CaseStudyImage({ slot, alt, className = "" }: CaseStudyImageProps) {
  const [failed, setFailed] = useState(false);
  const { src, renderKind } = resolveUxVisual(slot);

  if (renderKind === "wireframe") {
    return <WireframeMock className={className} />;
  }

  if (renderKind === "placeholder" || !src || failed) {
    return <ScreenshotPlaceholder slot={slot} className={className} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`w-full h-auto object-contain bg-white rounded-2xl border border-gray-200 ${className}`}
    />
  );
}

/** @deprecated Use CaseStudyImage with slot */
export const CaseStudyScreenshot = CaseStudyImage;
