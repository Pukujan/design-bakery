import { HeroSectionV2 } from "./components/v2/HeroSectionV2";
import { OverviewSectionV2 } from "./components/v2/OverviewSectionV2";
import { ProblemSectionV2 } from "./components/v2/ProblemSectionV2";
import { ResearchSectionV2 } from "./components/v2/ResearchSectionV2";
import { PrototypeTestingSectionV2 } from "./components/v2/PrototypeTestingSectionV2";
import { ProductWalkthroughVideoSectionV2 } from "./components/v2/ProductWalkthroughVideoSectionV2";
import { GoalsSectionV2 } from "./components/v2/GoalsSectionV2";
import { ProductDesignSection } from "./components/v2/ProductDesignSection";
import { AwardsRecognitionSectionV2 } from "./components/v2/AwardsRecognitionSectionV2";
import { ArchitectureSectionV2 } from "./components/v2/ArchitectureSectionV2";
import { FrontendSection } from "./components/v2/FrontendSection";
import { DataIntegrationSectionV2 } from "./components/v2/DataIntegrationSectionV2";
import { PDFGenerationSectionV2 } from "./components/v2/PDFGenerationSectionV2";
import { B2BSaaSSectionV2 } from "./components/v2/B2BSaaSSectionV2";
import { ProductDesignOwnershipSection } from "./components/v2/ProductDesignOwnershipSection";
import { PerformanceSectionV2 } from "./components/v2/PerformanceSectionV2";
import { CollaborationSection } from "./components/v2/CollaborationSection";
import { ImpactSectionV2 } from "./components/v2/ImpactSectionV2";
import { LearningSectionV2 } from "./components/v2/LearningSectionV2";
import { ReflectionSectionV2 } from "./components/v2/ReflectionSectionV2";
import { EkagajpatraDemoVideoButton } from "./components/v2/EkagajpatraDemoVideoButton";

export default function App() {
  return (
    <div className="min-h-screen">
      <EkagajpatraDemoVideoButton />
      <HeroSectionV2 />
      <OverviewSectionV2 />
      <ProblemSectionV2 />
      <ResearchSectionV2 />
      <PrototypeTestingSectionV2 />
      <ProductWalkthroughVideoSectionV2 />
      <ProductDesignSection />
      <GoalsSectionV2 />
      <ArchitectureSectionV2 />
      <FrontendSection />
      <DataIntegrationSectionV2 />
      <PDFGenerationSectionV2 />
      <B2BSaaSSectionV2 />
      <ProductDesignOwnershipSection />
      <PerformanceSectionV2 />
      <CollaborationSection />
      <AwardsRecognitionSectionV2 />
      <ImpactSectionV2 />
      <LearningSectionV2 />
      <ReflectionSectionV2 />
    </div>
  );
}
