import { useEffect, useRef, useState } from 'react';
import type { ComponentProps, RefObject } from 'react';
import { Hero } from '../Hero/Hero';
import { WebDesignShowcase } from '../WebDesignShowcase/WebDesignShowcase';
import { About } from '../About/About';
import { Advocacy } from '../Advocacy/Advocacy';
import { ArtGallery } from '../ArtGallery/ArtGallery';
import { Skills } from '../Skills/Skills';
import { Blog } from '../Blog/Blog';
import { Contact } from '../../../components/Contact';
import { Footer } from '../../../components/Footer';
import { GalleryPage } from '../GalleryPage/GalleryPage';
import {
  abstractCollageGallery,
  communityEventsGallery,
  communityWorkshopsGallery,
  mixedMediaGallery,
  posterArtGallery,
  prideCommunityGallery,
  prideMonthGallery,
} from './galleryData';

export function DesignPortfolio() {
  const showcaseRef = useRef<HTMLDivElement>(null);
  const advocacyRef = useRef<HTMLDivElement>(null);
  const [currentGallery, setCurrentGallery] = useState<string | null>(null);

  const scrollToSection = (section: string) => {
    const refs: Record<string, RefObject<HTMLDivElement | null>> = {
      showcase: showcaseRef,
      advocacy: advocacyRef,
    };

    const ref = refs[section];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleGalleryClick = (galleryId: string) => {
    setCurrentGallery(galleryId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToPortfolio = () => {
    setCurrentGallery(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const parallaxElements = document.querySelectorAll('.parallax');

      parallaxElements.forEach((el) => {
        const speed = el.getAttribute('data-speed') || '0.5';
        const yPos = -(scrolled * parseFloat(speed));
        (el as HTMLElement).style.transform = `translateY(${yPos}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  type GalleryData = {
    title: string;
    description: string;
    color: string;
    items: ComponentProps<typeof GalleryPage>['items'];
  };

  if (currentGallery) {
    const galleries: Record<string, GalleryData> = {
      'community-workshops': communityWorkshopsGallery,
      'pride-community': prideCommunityGallery,
      'abstract-collage': abstractCollageGallery,
      'mixed-media': mixedMediaGallery,
      'poster-art': posterArtGallery,
      'pride-month': prideMonthGallery,
      'community-events': communityEventsGallery,
    };

    const gallery = galleries[currentGallery];
    const allowUpload = false;

    if (gallery) {
      return (
        <GalleryPage
          title={gallery.title}
          description={gallery.description}
          color={gallery.color}
          items={gallery.items}
          onBack={handleBackToPortfolio}
          allowUpload={allowUpload}
        />
      );
    }
  }

  return (
    <>
      <Hero onNavigate={scrollToSection} />

      <div ref={showcaseRef}>
        <WebDesignShowcase />
      </div>

      <About />

      <div ref={advocacyRef}>
        <Advocacy onGalleryClick={handleGalleryClick} />
      </div>

      <ArtGallery onGalleryClick={handleGalleryClick} />

      <Skills />

      <Blog />

      <Contact />

      <Footer />
    </>
  );
}
