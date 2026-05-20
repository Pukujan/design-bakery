import { EngineeringHero } from './EngineeringHero';
import { EngineeringProjects } from './EngineeringProjects';
import { EngineeringCommunity } from './EngineeringCommunity';
import { EngineeringAbout } from './EngineeringAbout';
import { RelevantExperience } from './RelevantExperience';
import { EngineeringSkills } from './EngineeringSkills';
import { EngineeringInsights } from './EngineeringInsights';
import { Contact } from './Contact';
import { Footer } from './Footer';

export function EngineeringHome() {
  return (
    <>
      <EngineeringHero />
      <EngineeringProjects />
      <EngineeringCommunity />
      <EngineeringAbout />
      <RelevantExperience />
      <EngineeringSkills />
      <EngineeringInsights />
      <Contact />
      <Footer />
    </>
  );
}