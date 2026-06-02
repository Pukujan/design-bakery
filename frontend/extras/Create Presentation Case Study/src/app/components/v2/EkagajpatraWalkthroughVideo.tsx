import { forwardRef } from "react";
import { cn } from "../ui/utils";
import { ekagajpatraUxAssets } from "./ekagajpatraUxAssets";

const VIDEO_SRC = ekagajpatraUxAssets.productWalkthrough;
const CAPTIONS_SRC = ekagajpatraUxAssets.captions;

type EkagajpatraWalkthroughVideoProps = {
  className?: string;
  videoClassName?: string;
};

export const EkagajpatraWalkthroughVideo = forwardRef<
  HTMLVideoElement,
  EkagajpatraWalkthroughVideoProps
>(function EkagajpatraWalkthroughVideo({ className, videoClassName }, ref) {
  return (
    <div className={cn("bg-white rounded-2xl p-2 md:p-3 border border-gray-200 shadow-sm", className)}>
      <video
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-black",
          videoClassName,
        )}
        controls
        preload="metadata"
        playsInline
      >
        <source src={VIDEO_SRC} type="video/mp4" />
        <track kind="captions" src={CAPTIONS_SRC} srcLang="en" label="English" default />
        Your browser does not support the video tag.
      </video>
    </div>
  );
});
