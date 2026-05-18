import { HeroSection } from "./components/HeroSection";
import { ProblemSection } from "./components/ProblemSection";
import { GoalsSection } from "./components/GoalsSection";
import { ResearchSection } from "./components/ResearchSection";
import { DesignProcessSection } from "./components/DesignProcessSection";
import { KeyFeaturesSection } from "./components/KeyFeaturesSection";
import { ImpactSection } from "./components/ImpactSection";
import { AwardsSection } from "./components/AwardsSection";
import { SocialImpactSection } from "./components/SocialImpactSection";
import { RoleSection } from "./components/RoleSection";
import { ReflectionSection } from "./components/ReflectionSection";

export default function AppV1() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <ProblemSection />
      <GoalsSection />
      <ResearchSection />
      <DesignProcessSection />
      <KeyFeaturesSection />
      <ImpactSection />
      <AwardsSection />
      <SocialImpactSection />
      <RoleSection />
      <ReflectionSection />
    </div>
  );
}
