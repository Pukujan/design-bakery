import { EngineeringHero } from '../EngineeringHero/EngineeringHero';
import { EngineeringProjects } from '../EngineeringProjects/EngineeringProjects';
import { EngineeringCommunity } from '../EngineeringCommunity/EngineeringCommunity';
import { EngineeringAbout } from '../EngineeringAbout/EngineeringAbout';
import { EngineeringSkills } from '../EngineeringSkills/EngineeringSkills';
import { EngineeringInsights } from '../EngineeringInsights/EngineeringInsights';
import { RelevantExperience } from '../../../components/RelevantExperience';
import { Contact } from '../../../components/Contact';
import { Footer } from '../../../components/Footer';

export function EngineeringHome() {
  return (
    <>
      <EngineeringHero />
      <EngineeringProjects />
      <EngineeringCommunity />
      <EngineeringAbout />
      <EngineeringSkills />
      <EngineeringInsights />
      <RelevantExperience />
      <Contact />
      <Footer />
    </>
  );
}
