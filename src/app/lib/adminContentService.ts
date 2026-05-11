/**
 * Firestore CRUD service for the admin panel.
 * Each content type maps to a top-level Firestore collection.
 * Array-based content (e.g. skills, advocacy images) is stored as a
 * single document doc("data") inside each collection so the whole list
 * can be fetched / replaced atomically.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  type DocumentData,
} from 'firebase/firestore';
import { firestore } from './firebase';

// Local JSON fallbacks (used when Firestore collection is empty / not yet seeded)
import _timelineJson from '../modules/design/About/timeline.json';
import _skillsJson from '../modules/design/Skills/skills.json';
import _engSkillsJson from '../modules/engineering/EngineeringSkills/skill-categories.json';
import _advocacyJson from '../modules/design/Advocacy/advocacy-images.json';
import _artJson from '../modules/design/ArtGallery/art-pieces.json';
import _projectsJson from '../modules/engineering/EngineeringProjects/projects.json';
import _socialLinksJson from '../components/social-links.json';
import _webProjectsJson from '../modules/design/WebDesignShowcase/showcase-web-projects.json';
import _aiProjectsJson from '../modules/design/WebDesignShowcase/showcase-ai-projects.json';
import _blogCategoriesJson from '../modules/engineering/blog-categories.json';
import _abstractCollageJson from '../modules/design/DesignPortfolio/gallery-abstract-collage.json';
import _communityEventsJson from '../modules/design/DesignPortfolio/gallery-community-events.json';
import _communityWorkshopsJson from '../modules/design/DesignPortfolio/gallery-community-workshops.json';
import _mixedMediaJson from '../modules/design/DesignPortfolio/gallery-mixed-media.json';
import _posterArtJson from '../modules/design/DesignPortfolio/gallery-poster-art.json';
import _prideCommunityJson from '../modules/design/DesignPortfolio/gallery-pride-community.json';
import _prideMonthJson from '../modules/design/DesignPortfolio/gallery-pride-month.json';
import _blogsJson from '../modules/engineering/blog-data.json';

function db() {
  if (!firestore) throw new Error('Firestore is not configured.');
  return firestore;
}

// ─────────────────────────────────────────────────────────────
// Generic helpers
// ─────────────────────────────────────────────────────────────

/** Replace an entire array-valued document (stored at collection/data). */
export async function setArrayDoc(collectionName: string, items: unknown[]) {
  await setDoc(doc(db(), collectionName, 'data'), { items });
}

/** Read an entire array-valued document. Falls back to `fallback` if Firestore has no data yet. */
export async function getArrayDoc<T>(collectionName: string, fallback: T[] = []): Promise<T[]> {
  const { getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db(), collectionName, 'data'));
  if (!snap.exists()) return fallback;
  const data = snap.data() as { items: T[] };
  return data.items ?? fallback;
}

/** Replace a singleton object document (stored at collection/data). */
export async function setObjectDoc(collectionName: string, item: unknown) {
  await setDoc(doc(db(), collectionName, 'data'), { item });
}

/** Read a singleton object document. Falls back to `fallback` if missing. */
export async function getObjectDoc<T>(collectionName: string, fallback: T): Promise<T> {
  const { getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db(), collectionName, 'data'));
  if (!snap.exists()) return fallback;
  const data = snap.data() as { item?: T };
  return data.item ?? fallback;
}

// ─────────────────────────────────────────────────────────────
// Blog Posts  (stored as individual docs for easy CRUD)
// ─────────────────────────────────────────────────────────────

export interface BlogPost {
  id?: string;          // Firestore doc ID
  numericId?: number;   // original numeric ordering
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  category: string;
  color: string;
  author: string;
  content: string;
}

export async function getBlogs(): Promise<BlogPost[]> {
  const q = query(collection(db(), 'blog_posts'), orderBy('numericId', 'asc'));
  const snap = await getDocs(q);

  const firestoreBlogs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost));
  const fallbackBlogs = (_blogsJson as unknown as BlogPost[]).map((p, i) => ({
    ...p,
    numericId: p.numericId ?? i + 1,
  }));

  // Merge fallback + Firestore so legacy local posts do not disappear after first admin save.
  const byKey = new Map<string, BlogPost>();
  for (const post of fallbackBlogs) {
    byKey.set(`n:${post.numericId ?? -1}|t:${post.title}`, post);
  }
  for (const post of firestoreBlogs) {
    byKey.set(`n:${post.numericId ?? -1}|t:${post.title}`, post);
  }

  return [...byKey.values()].sort((a, b) => (a.numericId ?? 0) - (b.numericId ?? 0));
}

async function seedMissingFallbackBlogs() {
  const q = query(collection(db(), 'blog_posts'), orderBy('numericId', 'asc'));
  const snap = await getDocs(q);

  const existingKeys = new Set(
    snap.docs.map((d) => {
      const p = d.data() as BlogPost;
      return `n:${p.numericId ?? -1}|t:${p.title}`;
    })
  );

  const fallback = (_blogsJson as unknown as BlogPost[]).map((p, i) => ({
    ...p,
    numericId: p.numericId ?? i + 1,
  }));

  const missing = fallback.filter((post) => !existingKeys.has(`n:${post.numericId ?? -1}|t:${post.title}`));
  if (missing.length === 0) return;

  await Promise.all(
    missing.map((post) => {
      const { id, ...data } = post;
      const seedId = typeof id === 'string' && id.length > 0 ? `seed-${id}` : `seed-${data.numericId}`;
      return setDoc(doc(db(), 'blog_posts', seedId), data);
    })
  );
}

export async function saveBlog(post: BlogPost): Promise<string> {
  await seedMissingFallbackBlogs();

  if (post.id) {
    const { id, ...data } = post;
    await setDoc(doc(db(), 'blog_posts', id), data);
    return id;
  }

  const data: BlogPost = { ...post };
  if (!data.numericId || data.numericId <= 0) {
    const existing = await getBlogs();
    const maxId = existing.reduce((max, p) => Math.max(max, p.numericId ?? 0), 0);
    data.numericId = maxId + 1;
  }

  const ref = await addDoc(collection(db(), 'blog_posts'), data);
  return ref.id;
}

export async function deleteBlog(id: string) {
  await deleteDoc(doc(db(), 'blog_posts', id));
}

// ─────────────────────────────────────────────────────────────
// Blog Categories
// ─────────────────────────────────────────────────────────────

export interface BlogCategory {
  id: string;
  label: string;
  color: string;
}

export const getBlogCategories = () => getArrayDoc<BlogCategory>('blog_categories', _blogCategoriesJson as BlogCategory[]);
export const setBlogCategories = (items: BlogCategory[]) => setArrayDoc('blog_categories', items);

// ─────────────────────────────────────────────────────────────
// About / Timeline
// ─────────────────────────────────────────────────────────────

export interface TimelineEntry {
  org: string;
  role: string;
  color: string;
  [key: string]: unknown;
}

export const getTimeline = () => getArrayDoc<TimelineEntry>('about_timeline', _timelineJson as TimelineEntry[]);
export const setTimeline = (items: TimelineEntry[]) => setArrayDoc('about_timeline', items);

// ─────────────────────────────────────────────────────────────
// Skills (design)
// ─────────────────────────────────────────────────────────────

export interface Skill {
  name: string;
  color: string;
}

export const getSkills = () => getArrayDoc<Skill>('skills', _skillsJson as Skill[]);
export const setSkills = (items: Skill[]) => setArrayDoc('skills', items);

// ─────────────────────────────────────────────────────────────
// Engineering Skills
// ─────────────────────────────────────────────────────────────

export interface SkillCategory {
  title: string;
  icon: string;
  color: string;
  skills: string[];
}

export const getEngineeringSkills = () => getArrayDoc<SkillCategory>('engineering_skills', _engSkillsJson as SkillCategory[]);
export const setEngineeringSkills = (items: SkillCategory[]) => setArrayDoc('engineering_skills', items);

// ─────────────────────────────────────────────────────────────
// Advocacy Images
// ─────────────────────────────────────────────────────────────

export interface AdvocacyImage {
  id: number;
  src: string;
  caption: string;
  color: string;
}

export const getAdvocacyImages = () => getArrayDoc<AdvocacyImage>('advocacy_images', _advocacyJson as unknown as AdvocacyImage[]);
export const setAdvocacyImages = (items: AdvocacyImage[]) => setArrayDoc('advocacy_images', items);

// ─────────────────────────────────────────────────────────────
// Art Gallery
// ─────────────────────────────────────────────────────────────

export type ArtPiece = AdvocacyImage;

export const getArtPieces = () => getArrayDoc<ArtPiece>('art_gallery', _artJson as unknown as ArtPiece[]);
export const setArtPieces = (items: ArtPiece[]) => setArrayDoc('art_gallery', items);

// ─────────────────────────────────────────────────────────────
// Engineering Projects
// ─────────────────────────────────────────────────────────────

export interface Project {
  id: number;
  title: string;
  tagline: string;
  description: string;
  tech: string[];
  color: string;
  accentColor: string;
  stats: { label: string; icon: string }[];
  links: { label: string; url: string }[];
}

export const getProjects = () => getArrayDoc<Project>('engineering_projects', _projectsJson as unknown as Project[]);
export const setProjects = (items: Project[]) => setArrayDoc('engineering_projects', items);

// ─────────────────────────────────────────────────────────────
// Contact / Social Links
// ─────────────────────────────────────────────────────────────

export interface SocialLink {
  name: string;
  icon: string;
  href: string;
  handle: string;
  color: string;
}

export const getSocialLinks = () => getArrayDoc<SocialLink>('social_links', _socialLinksJson as SocialLink[]);
export const setSocialLinks = (items: SocialLink[]) => setArrayDoc('social_links', items);

// ─────────────────────────────────────────────────────────────
// Web Design Showcase
// ─────────────────────────────────────────────────────────────

export interface ShowcaseProject {
  id: number;
  title: string;
  description: string;
  image: string;
  color: string;
  link: string;
  type: string;
}

export const getWebProjects = () => getArrayDoc<ShowcaseProject>('web_projects', _webProjectsJson as ShowcaseProject[]);
export const setWebProjects = (items: ShowcaseProject[]) => setArrayDoc('web_projects', items);

export const getAiProjects = () => getArrayDoc<ShowcaseProject>('ai_projects', _aiProjectsJson as ShowcaseProject[]);
export const setAiProjects = (items: ShowcaseProject[]) => setArrayDoc('ai_projects', items);

// ─────────────────────────────────────────────────────────────
// Gallery Page (7 categories stored individually)
// ─────────────────────────────────────────────────────────────

export interface GalleryItem {
  id: number;
  image: string;
  title: string;
  description: string;
  date: string;
  link?: string;
  comingSoon?: boolean;
}

export type GalleryKey =
  | 'abstract_collage'
  | 'community_events'
  | 'community_workshops'
  | 'mixed_media'
  | 'poster_art'
  | 'pride_community'
  | 'pride_month';

const _galleryFallbacks: Record<GalleryKey, GalleryItem[]> = {
  abstract_collage: (_abstractCollageJson as unknown as { items: GalleryItem[] }).items,
  community_events: (_communityEventsJson as unknown as { items: GalleryItem[] }).items,
  community_workshops: (_communityWorkshopsJson as unknown as { items: GalleryItem[] }).items,
  mixed_media: (_mixedMediaJson as unknown as { items: GalleryItem[] }).items,
  poster_art: (_posterArtJson as unknown as { items: GalleryItem[] }).items,
  pride_community: (_prideCommunityJson as unknown as { items: GalleryItem[] }).items,
  pride_month: (_prideMonthJson as unknown as { items: GalleryItem[] }).items,
};
export const getGallery = (key: GalleryKey) => getArrayDoc<GalleryItem>(`gallery_${key}`, _galleryFallbacks[key]);
export const setGallery = (key: GalleryKey, items: GalleryItem[]) =>
  setArrayDoc(`gallery_${key}`, items);

// ─────────────────────────────────────────────────────────────
// Engineering Hero (singleton)
// ─────────────────────────────────────────────────────────────

export interface HeroStat {
  label: string;
  value: string;
}

export interface EngineeringHeroContent {
  badge: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  primaryCtaLabel: string;
  stats: HeroStat[];
}

export const ENGINEERING_HERO_DEFAULT: EngineeringHeroContent = {
  badge: 'DESIGNER-ENGINEER / FULL-STACK DEVELOPER',
  titleLine1: '0→1 and 1→+',
  titleLine2: 'Design-led engineering with end-to-end ownership',
  description:
    'Design-Engineer and Full-Stack Developer who takes products from early concept to production and beyond. I combine product design, frontend architecture, supporting backend APIs, and AI-enabled workflows to build scalable systems used by real users.',
  primaryCtaLabel: 'View Engineering Projects',
  stats: [
    { label: 'Users Served', value: '35,000+' },
    { label: 'Cost Reduction', value: '99%' },
    { label: 'Awards Won', value: '5' },
  ],
};

export const getEngineeringHeroContent = () =>
  getObjectDoc<EngineeringHeroContent>('engineering_hero_content', ENGINEERING_HERO_DEFAULT);
export const setEngineeringHeroContent = (item: EngineeringHeroContent) =>
  setObjectDoc('engineering_hero_content', item);

// ─────────────────────────────────────────────────────────────
// Engineering Community & Advisory (singleton)
// ─────────────────────────────────────────────────────────────

export interface CommunityContribution {
  icon: string;
  text: string;
}

export interface CommunityOrg {
  icon: string;
  name: string;
  role: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
  buttonColorClass: string;
  contributionsHeading: string;
  contributions: CommunityContribution[];
}

export interface EngineeringCommunityContent {
  headingLeft: string;
  headingRight: string;
  subtitle: string;
  orgs: CommunityOrg[];
}

export const ENGINEERING_COMMUNITY_DEFAULT: EngineeringCommunityContent = {
  headingLeft: 'COMMUNITY &',
  headingRight: 'ADVISORY',
  subtitle:
    'Engineering mentorship, advocacy, and AI product enablement beyond commercial work',
  orgs: [
    {
      icon: 'Users',
      name: 'Women Devs SG',
      role: 'Volunteer Advocate — Engineering & Product Enablement',
      description:
        'Contributed as a volunteer advocate supporting women in technology through engineering mentorship, product thinking, and AI enablement. Work focused on helping participants understand real-world product development, engineering workflows, and system thinking.',
      buttonLabel: 'Visit Women Devs SG',
      buttonUrl: 'https://www.linkedin.com/company/women-devs-sg/',
      buttonColorClass: 'bg-cyan-600 hover:bg-cyan-700',
      contributionsHeading: 'Key Contributions',
      contributions: [
        {
          icon: 'BookOpen',
          text: 'Creating technical and product-focused presentation decks for workshops',
        },
        {
          icon: 'Target',
          text: 'Co-developing mentorship handbooks and community guidance materials',
        },
        {
          icon: 'Lightbulb',
          text: 'Supporting programs across engineering mentorship, product ownership, AI enablement, and leadership development',
        },
        {
          icon: 'Users',
          text: 'Collaborating with mentors, engineers, and organizers to scale community impact',
        },
      ],
    },
    {
      icon: 'Lightbulb',
      name: 'TAILORU Collective',
      role: 'AI Engineering Research · Product Ownership',
      description:
        'Research and advisory work focused on AI-enabled product development and system ownership. Supporting teams in translating business problems into practical, scalable product workflows using AI as an enabling layer.',
      buttonLabel: 'Visit Tailoru Collective',
      buttonUrl: 'https://www.tailoru.studio/',
      buttonColorClass: 'bg-emerald-600 hover:bg-emerald-700',
      contributionsHeading: 'Key Contributions — AI Engineering Researcher',
      contributions: [
        {
          icon: 'Cpu',
          text: 'Researched and prototyped agentic AI architectures for full-stack SaaS products, focused on financial and civic-tech use cases',
        },
        {
          icon: 'Layers',
          text: 'Designed and built end-to-end experimental systems (frontend, backend, data, and AI orchestration) to validate product feasibility',
        },
        {
          icon: 'GitBranch',
          text: 'Explored multi-agent orchestration patterns, task decomposition, and RAG pipelines for complex business workflows',
        },
        {
          icon: 'Rocket',
          text: 'Led 0 → 1 MVP builds and evaluated paths from MVP to production-ready AI systems',
        },
        {
          icon: 'Users2',
          text: 'Facilitated hands-on co-building sessions with teams to learn through real project constraints, identify patterns, and overcome implementation challenges',
        },
      ],
    },
  ],
};

export const getEngineeringCommunityContent = () =>
  getObjectDoc<EngineeringCommunityContent>(
    'engineering_community_content',
    ENGINEERING_COMMUNITY_DEFAULT
  );
export const setEngineeringCommunityContent = (item: EngineeringCommunityContent) =>
  setObjectDoc('engineering_community_content', item);

// ─────────────────────────────────────────────────────────────
// Engineering About Me (singleton)
// ─────────────────────────────────────────────────────────────

export interface EngineeringAboutHighlight {
  icon: string;
  title: string;
  desc: string;
  color: string;
}

export interface EngineeringAboutContent {
  headingLeft: string;
  headingRight: string;
  portraitUrl: string;
  roleTitle: string;
  paragraphs: string[];
  highlights: EngineeringAboutHighlight[];
  callout: string;
}

export const ENGINEERING_ABOUT_DEFAULT: EngineeringAboutContent = {
  headingLeft: 'ABOUT',
  headingRight: 'ME',
  portraitUrl: 'https://i.imgur.com/umGE4Kd.jpeg',
  roleTitle: 'Designer-Engineer / Full-Stack Developer',
  paragraphs: [
    'I work at the intersection of design and engineering, owning products end-to-end as they move from idea to execution and scale.',
    'From 0→1, I focus on product design, UX, and frontend architecture to turn ambiguous problems into usable systems.',
    'From 1→+, I strengthen those systems through backend integration, reliability improvements, and AI-enabled workflows.',
  ],
  highlights: [
    {
      icon: 'Code',
      title: 'Systems Engineering',
      desc: 'Building reliable systems for complex domains',
      color: '#4169E1',
    },
    {
      icon: 'Shield',
      title: 'Data Correctness',
      desc: 'Validation, error handling, and user trust',
      color: '#9B6DD6',
    },
    {
      icon: 'Zap',
      title: 'Cross-functional Collaboration',
      desc: 'Working with backend engineers, legal experts, and product teams',
      color: '#FF8C42',
    },
  ],
  callout:
    'Every system I build combines product design, frontend architecture, supporting backend APIs, and AI-enabled workflows - written with reliability, maintainability, and real-world impact in mind.',
};

export const getEngineeringAboutContent = () =>
  getObjectDoc<EngineeringAboutContent>('engineering_about_content', ENGINEERING_ABOUT_DEFAULT);
export const setEngineeringAboutContent = (item: EngineeringAboutContent) =>
  setObjectDoc('engineering_about_content', item);

// ─────────────────────────────────────────────────────────────
// Engineering Skills & Technologies heading (singleton)
// ─────────────────────────────────────────────────────────────

export interface EngineeringSkillsMeta {
  headingLeft: string;
  headingMiddle: string;
  headingRight: string;
}

export const ENGINEERING_SKILLS_META_DEFAULT: EngineeringSkillsMeta = {
  headingLeft: 'SKILLS',
  headingMiddle: '&',
  headingRight: 'TECHNOLOGIES',
};

export const getEngineeringSkillsMeta = () =>
  getObjectDoc<EngineeringSkillsMeta>('engineering_skills_meta', ENGINEERING_SKILLS_META_DEFAULT);
export const setEngineeringSkillsMeta = (item: EngineeringSkillsMeta) =>
  setObjectDoc('engineering_skills_meta', item);

// ─────────────────────────────────────────────────────────────
// Contact section copy (singleton)
// ─────────────────────────────────────────────────────────────

export interface ContactSectionContent {
  heading: string;
  quote: string;
  footerNote: string;
}

export const CONTACT_SECTION_DEFAULT: ContactSectionContent = {
  heading: "LET'S\nCONNECT",
  quote: "Let's create something that moves people.",
  footerNote:
    'Designed with empathy • Built with passion • 2025',
};

export const getContactSectionContent = () =>
  getObjectDoc<ContactSectionContent>('contact_section_content', CONTACT_SECTION_DEFAULT);
export const setContactSectionContent = (item: ContactSectionContent) =>
  setObjectDoc('contact_section_content', item);

// ─────────────────────────────────────────────────────────────
// Footer content (singleton)
// ─────────────────────────────────────────────────────────────

export interface FooterSocialLink {
  icon: string;
  href: string;
  label: string;
}

export interface FooterNavLink {
  label: string;
  href: string;
  type: 'route' | 'anchor';
}

export interface FooterContent {
  brandTitle: string;
  brandDescription: string;
  socialLinks: FooterSocialLink[];
  navigationLinks: FooterNavLink[];
  quickLinks: FooterNavLink[];
  copyrightText: string;
}

export const FOOTER_CONTENT_DEFAULT: FooterContent = {
  brandTitle: 'Design Baker',
  brandDescription: 'Engineered for reliability • Built for real-world impact',
  socialLinks: [
    { icon: 'Github', href: '#', label: 'GitHub' },
    { icon: 'Linkedin', href: '#', label: 'LinkedIn' },
    { icon: 'Twitter', href: '#', label: 'Twitter' },
    { icon: 'Mail', href: '#', label: 'Email' },
  ],
  navigationLinks: [
    { label: 'Engineering', href: '/', type: 'route' },
    { label: 'Design', href: '/design', type: 'route' },
    { label: 'Projects', href: '#projects', type: 'anchor' },
    { label: 'About', href: '#about', type: 'anchor' },
    { label: 'Contact', href: '#contact', type: 'anchor' },
  ],
  quickLinks: [
    { label: 'Skills', href: '#skills', type: 'anchor' },
    { label: 'Insights', href: '#insights', type: 'anchor' },
    { label: 'Case Study', href: '#ekagajpatra', type: 'anchor' },
  ],
  copyrightText: 'Design Baker. All rights reserved.',
};

export const getFooterContent = () =>
  getObjectDoc<FooterContent>('footer_content', FOOTER_CONTENT_DEFAULT);
export const setFooterContent = (item: FooterContent) =>
  setObjectDoc('footer_content', item);

// ─────────────────────────────────────────────────────────────
// Relevant Experience (singleton)
// ─────────────────────────────────────────────────────────────

export interface Experience {
  id: number;
  company: string;
  role: string;
  period: string;
  location: string;
  icon: string;
  color: string;
  accentColor: string;
  collapsedSummary: string;
  expandedSummary: string;
  highlights: string[];
  tags: string[];
}

export interface RelevantExperienceContent {
  headingLeft: string;
  headingRight: string;
  subtitle: string;
  resumeButtonLabel: string;
  experiences: Experience[];
}

export const RELEVANT_EXPERIENCE_DEFAULT: RelevantExperienceContent = {
  headingLeft: 'RELEVANT',
  headingRight: 'EXPERIENCE',
  subtitle: 'A journey of building, learning, and creating impact across design and engineering',
  resumeButtonLabel: 'Download My Resume',
  experiences: [
    {
      id: 1,
      company: 'Women Devs SG',
      role: 'Volunteer Advocate — Engineering & Product Enablement',
      period: '2024 - Present',
      location: 'Singapore',
      icon: 'Users',
      color: '#A8C5FF',
      accentColor: '#8EA7FF',
      collapsedSummary:
        'Supporting women in tech through engineering mentorship, product thinking, and AI enablement. Working with participants to understand real-world product development and system thinking.',
      expandedSummary:
        'Contributed as a volunteer advocate supporting women in technology through engineering mentorship, product thinking, and AI enablement. Work focused on helping participants understand real-world product development, engineering workflows, and system thinking.',
      highlights: [
        'Creating technical and product-focused presentation decks for workshops',
        'Co-developing mentorship handbooks and community guidance materials',
        'Supporting programs across engineering mentorship, product ownership, AI enablement, and leadership development',
        'Collaborating with mentors, engineers, and organizers to scale community impact',
      ],
      tags: ['Mentorship', 'Community', 'Product', 'Engineering', 'AI'],
    },
    {
      id: 2,
      company: 'TAILORU Collective',
      role: 'AI Engineering Research · Product Ownership',
      period: '2024 - Present',
      location: 'Singapore',
      icon: 'Lightbulb',
      color: '#B5A8FF',
      accentColor: '#9B8AFF',
      collapsedSummary:
        'Research and advisory work focused on AI-enabled product development and system ownership. Supporting teams in translating business problems into practical, scalable product workflows.',
      expandedSummary:
        'Research and advisory work focused on AI-enabled product development and system ownership. Supporting teams in translating business problems into practical, scalable product workflows using AI as an enabling layer.',
      highlights: [
        'Researched and prototyped agentic AI architectures for full-stack SaaS products',
        'Designed and built end-to-end experimental systems (frontend, backend, data, and AI orchestration)',
        'Explored multi-agent orchestration patterns, task decomposition, and RAG pipelines',
        'Led 0 → 1 MVP builds and evaluated paths from MVP to production-ready AI systems',
        'Facilitated co-building sessions with teams to learn through real project constraints',
      ],
      tags: ['AI', 'Research', 'Full-Stack', 'Product', 'Architecture'],
    },
    {
      id: 3,
      company: 'Design Baker',
      role: 'Founder · Full-Stack Designer-Engineer',
      period: '2023 - Present',
      location: 'Singapore',
      icon: 'Rocket',
      color: '#A8FFD4',
      accentColor: '#8EFFBE',
      collapsedSummary:
        'Building a multi-disciplinary portfolio showcasing design, engineering, and advocacy work. Combining product design, full-stack development, and AI-enabled workflows.',
      expandedSummary:
        'Building a comprehensive portfolio that brings together design, engineering, and community advocacy. Combining product design, full-stack development, and AI-enabled workflows to create systems with real-world impact.',
      highlights: [
        'Designed and built responsive, accessible web experiences from concept to deployment',
        'Integrated AI-powered features to enhance user experiences and streamline workflows',
        'Managed full product lifecycle from design conception through deployment and iteration',
        'Created dynamic content management with Firestore integration for seamless updates',
        'Built admin dashboards for non-technical content management and real-time editing',
      ],
      tags: ['Design', 'Full-Stack', 'React', 'TypeScript', 'Firestore', 'UX'],
    },
  ],
};

export const getRelevantExperienceContent = () =>
  getObjectDoc<RelevantExperienceContent>(
    'relevant_experience_content',
    RELEVANT_EXPERIENCE_DEFAULT
  );
export const setRelevantExperienceContent = (item: RelevantExperienceContent) =>
  setObjectDoc('relevant_experience_content', item);
