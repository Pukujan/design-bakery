const UX_IMAGE_BASE = "/images/case-studies/ekagajpatra";

/** Screenshots extracted from ekagajpatra_case_study_corrected_ab_visual.html */
const VERIFIED_UX_FILENAMES = new Set([
  "prototype-service-grouping.png",
  "prototype-guided-form.png",
  "prototype-preview-before-download.png",
  "ab-task-blocks-b.png",
  "ab-guided-form-b.png",
  "ab-preview-flow-b.png",
]);

export const ekagajpatraUxAssets = {
  prototypeEvolution: {
    earlyPrototype: `${UX_IMAGE_BASE}/prototype-early-document-catalog.png`,
    serviceGrouping: `${UX_IMAGE_BASE}/prototype-service-grouping.png`,
    guidedForm: `${UX_IMAGE_BASE}/prototype-guided-form.png`,
    contextualHelp: `${UX_IMAGE_BASE}/prototype-contextual-help.png`,
    previewBeforeDownload: `${UX_IMAGE_BASE}/prototype-preview-before-download.png`,
    dashboardAccess: `${UX_IMAGE_BASE}/prototype-dashboard-access.png`,
  },
  abTests: {
    catalogA: `${UX_IMAGE_BASE}/ab-catalog-list-a.png`,
    taskBlocksB: `${UX_IMAGE_BASE}/ab-task-blocks-b.png`,
    longFormA: `${UX_IMAGE_BASE}/ab-long-form-a.png`,
    guidedFormB: `${UX_IMAGE_BASE}/ab-guided-form-b.png`,
    downloadOnlyA: `${UX_IMAGE_BASE}/ab-download-only-a.png`,
    previewFlowB: `${UX_IMAGE_BASE}/ab-preview-flow-b.png`,
  },
  productWalkthrough: "/videos/ekagajpatra-original-nepali-english-subtitles.mp4",
  captions: "/videos/ekagajpatra-english-subtitles.vtt",
} as const;

export type UxVisualKind = "verified-image" | "wireframe" | "placeholder";

export type UxVisualSlot = {
  path: string;
  fallbackLabel: string;
  kind: UxVisualKind;
  placeholderTitle?: string;
  placeholderHint?: string;
};

export function uxFallbackLabel(path: string): string {
  return path.split("/").pop() ?? path;
}

export function isVerifiedUxFilename(filename: string): boolean {
  return VERIFIED_UX_FILENAMES.has(filename);
}

/** Resolve how a slot should render, following the corrected HTML reference. */
export function resolveUxVisual(slot: UxVisualSlot): {
  src: string | null;
  renderKind: UxVisualKind;
} {
  if (slot.kind === "wireframe") {
    return { src: null, renderKind: "wireframe" };
  }

  if (slot.kind === "placeholder") {
    return { src: null, renderKind: "placeholder" };
  }

  const filename = uxFallbackLabel(slot.path);
  if (isVerifiedUxFilename(filename)) {
    return { src: slot.path, renderKind: "verified-image" };
  }

  return { src: null, renderKind: "placeholder" };
}

/** @deprecated Use resolveUxVisual */
export function resolveVerifiedUxImage(path: string): string | null {
  const filename = uxFallbackLabel(path);
  if (!isVerifiedUxFilename(filename)) return null;
  return path;
}
