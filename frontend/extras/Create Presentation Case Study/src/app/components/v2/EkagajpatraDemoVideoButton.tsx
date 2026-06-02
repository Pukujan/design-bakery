import { useEffect, useRef, useState } from "react";
import { PlayCircle } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { EkagajpatraWalkthroughVideo } from "./EkagajpatraWalkthroughVideo";

const WALKTHROUGH_SECTION_ID = "product-walkthrough";

export function EkagajpatraDemoVideoButton() {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (open) {
      void video.play().catch(() => {});
      return;
    }
    video.pause();
    video.currentTime = 0;
  }, [open]);

  const scrollToWalkthroughSection = () => {
    setOpen(false);
    window.setTimeout(() => {
      document.getElementById(WALKTHROUGH_SECTION_ID)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 200);
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="fixed top-5 right-5 z-40 rounded-full shadow-lg border border-primary/15 px-4 md:px-5 h-auto py-2.5 md:py-3 gap-2 max-w-[calc(100vw-2.5rem)]"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <PlayCircle className="size-5 shrink-0" aria-hidden />
        <span className="flex flex-col items-start leading-tight text-left">
          <span className="text-sm md:text-base font-bold">Demo Video</span>
          <span className="text-[11px] md:text-xs font-medium opacity-80">
            English subtitles
          </span>
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl gap-4 p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="text-primary">Product walkthrough</DialogTitle>
            <DialogDescription>
              Original Ekagajpatra product demo with English captions for portfolio review.
            </DialogDescription>
          </DialogHeader>
          <EkagajpatraWalkthroughVideo ref={videoRef} className="border-0 shadow-none p-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Turn on captions in the video controls if subtitles are not visible. The full
            walkthrough section remains on this page for context.
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={scrollToWalkthroughSection}
          >
            Jump to walkthrough section
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
