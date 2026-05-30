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
    const id = decodeURIComponent(location.hash.replace(/^#/, ''));
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
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
