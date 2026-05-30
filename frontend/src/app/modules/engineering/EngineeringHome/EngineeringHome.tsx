import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { EngineeringHero } from '../EngineeringHero/EngineeringHero';
import { EngineeringProjects } from '../EngineeringProjects/EngineeringProjects';
import { EngineeringCommunity } from '../EngineeringCommunity/EngineeringCommunity';
import { EngineeringAbout } from '../EngineeringAbout/EngineeringAbout';
import { EngineeringSkills } from '../EngineeringSkills/EngineeringSkills';
import { EngineeringInsights } from '../EngineeringInsights/EngineeringInsights';
import { RelevantExperience } from '../../../components/RelevantExperience';
import { Contact } from '../../../components/Contact';
import { Footer } from '../../../components/Footer';
import { EngineeringHomeHead } from '@/seo/EngineeringHomeHead';

export function EngineeringHome() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const raw = decodeURIComponent(location.hash.replace(/^#/, ''));
    const experienceMatch = raw.match(/^experience-(\d+)$/);
    const projectMatch = raw.match(/^project-(\d+)$/);
    requestAnimationFrame(() => {
      if (experienceMatch) {
        document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (projectMatch) {
        document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      document.getElementById(raw)?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [location.pathname, location.hash]);

  return (
    <>
      <EngineeringHomeHead />
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
