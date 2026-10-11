import { About } from "@/components/journey/About";
import { Arrival } from "@/components/journey/Arrival";
import { Contact } from "@/components/journey/Night";
import { Cut } from "@/components/journey/Cut";
import { Night } from "@/components/journey/Night";
import { Stage } from "@/components/journey/Stage";
import { TopNav } from "@/components/journey/TopNav";
import { Work } from "@/components/journey/Work";
import { useJourneyScroll } from "@/hooks/useJourneyScroll";

const Index = () => {
  // the plates are the heart of the page; the driver warms them and re-measures
  useJourneyScroll();

  return (
    <>
      <a
        href="#work"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-cream"
      >
        Skip to the work
      </a>

      <Stage />

      <div className="db-flow">
        <TopNav />
        <main id="arrival">
          <Arrival />
          <Work />
          <About />
          <Cut />
          <Night />
          <Contact />
        </main>
      </div>
    </>
  );
};

export default Index;
