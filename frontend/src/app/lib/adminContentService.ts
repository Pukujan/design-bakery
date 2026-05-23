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
import { isSupabaseContentEnabled } from './contentApi';
import * as contentApi from './contentApi';
import type { PortfolioId } from '../portfolios/registry';
import { DEFAULT_PORTFOLIO_ID } from '../portfolios/registry';
import { resolveCollection } from '../portfolios/collections';
import {
  blogPostMergeKey,
  invalidateBlogCache,
  mergeBlogPostsWithFallback,
  nextBlogNumericId,
  resolveBlogNumericId,
  type BlogSeo,
} from '@/modules/blog/data/blogData';
import { normalizeBlogSeo } from '@/modules/blog/seo/blogMeta';
import { normalizeProjectLinks } from './caseStudyRoutes';

// Local JSON fallbacks (used when Firestore collection is empty / not yet seeded)
import _timelineJson from '../modules/design/About/timeline.json';
import _skillsJson from '../modules/design/Skills/skills.json';
import _advocacyJson from '../modules/design/Advocacy/advocacy-images.json';
import _artJson from '../modules/design/ArtGallery/art-pieces.json';
import _socialLinksJson from '../components/social-links.json';
import {
  PROJECT_FALLBACKS,
  ENG_SKILLS_FALLBACKS,
  getHeroFallback,
  getAboutFallback,
  getSkillsMetaFallback,
  getExperienceFallback,
} from '../portfolios/portfolioDefaults';
import _webProjectsJson from '../modules/design/WebDesignShowcase/showcase-web-projects.json';
import _aiProjectsJson from '../modules/design/WebDesignShowcase/showcase-ai-projects.json';
import _blogCategoriesJson from '@/modules/blog/data/blog-categories.json';
import _abstractCollageJson from '../modules/design/DesignPortfolio/gallery-abstract-collage.json';
import _communityEventsJson from '../modules/design/DesignPortfolio/gallery-community-events.json';
import _communityWorkshopsJson from '../modules/design/DesignPortfolio/gallery-community-workshops.json';
import _mixedMediaJson from '../modules/design/DesignPortfolio/gallery-mixed-media.json';
import _posterArtJson from '../modules/design/DesignPortfolio/gallery-poster-art.json';
import _prideCommunityJson from '../modules/design/DesignPortfolio/gallery-pride-community.json';
import _prideMonthJson from '../modules/design/DesignPortfolio/gallery-pride-month.json';
import _blogsJson from '@/modules/blog/data/blog-data.json';

function db() {
  if (!firestore) throw new Error('Firestore is not configured.');
  return firestore;
}

function col(portfolioId: PortfolioId, baseName: string): string {
  return resolveCollection(portfolioId, baseName);
}

/** True when a Firestore field actually carries content (not "", {}, or []). */
function hasMeaningfulValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number' || typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0 && value.some(hasMeaningfulValue);
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some(hasMeaningfulValue);
  }
  return false;
}

/** Supports `{ item }` (admin save), legacy root objects (old seed), and empty-doc fallback. */
function unwrapObjectFromFirestore<T>(data: DocumentData, fallback: T): T {
  if (hasMeaningfulValue(data.item)) {
    return data.item as T;
  }

  const { item: _item, items: _items, ...legacyFields } = data;
  if (hasMeaningfulValue(legacyFields)) {
    return legacyFields as T;
  }

  return fallback;
}

/** Supports `{ items }` and rejects empty arrays so repo JSON fallbacks apply. */
function unwrapArrayFromFirestore<T>(data: DocumentData, fallback: T[]): T[] {
  const wrapped = data.items;
  if (
    Array.isArray(wrapped) &&
    wrapped.length > 0 &&
    wrapped.some((entry) => hasMeaningfulValue(entry))
  ) {
    return wrapped as T[];
  }

  return fallback;
}

// ─────────────────────────────────────────────────────────────
// Generic helpers
// ─────────────────────────────────────────────────────────────

/** Replace an entire array-valued document (stored at collection/data). */
export async function setArrayDoc(collectionName: string, items: unknown[]) {
  if (isSupabaseContentEnabled()) {
    await contentApi.saveContentArray(collectionName, items);
    return;
  }
  await setDoc(doc(db(), collectionName, 'data'), { items }, { merge: false });
}

/** Read an entire array-valued document. Falls back when CMS is off, missing, empty, or errors. */
export async function getArrayDoc<T>(collectionName: string, fallback: T[] = []): Promise<T[]> {
  if (isSupabaseContentEnabled()) {
    try {
      const items = await contentApi.fetchContentArray<T>(collectionName);
      return items.length > 0 ? items : fallback;
    } catch {
      return fallback;
    }
  }
  if (!firestore) return fallback;

  try {
    const { getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(firestore, collectionName, 'data'));
    if (!snap.exists()) return fallback;
    return unwrapArrayFromFirestore<T>(snap.data(), fallback);
  } catch {
    return fallback;
  }
}

/** Replace a singleton object document (stored at collection/data). */
export async function setObjectDoc(collectionName: string, item: unknown) {
  if (isSupabaseContentEnabled()) {
    await contentApi.saveContentObject(collectionName, item);
    return;
  }
  await setDoc(doc(db(), collectionName, 'data'), { item }, { merge: false });
}

/** Read a singleton object document. Falls back when CMS is off, missing, or errors. */
export async function getObjectDoc<T>(collectionName: string, fallback: T): Promise<T> {
  if (isSupabaseContentEnabled()) {
    try {
      const item = await contentApi.fetchContentObject<T>(collectionName);
      return hasMeaningfulValue(item) ? item : fallback;
    } catch {
      return fallback;
    }
  }
  if (!firestore) return fallback;

  try {
    const { getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(firestore, collectionName, 'data'));
    if (!snap.exists()) return fallback;
    return unwrapObjectFromFirestore<T>(snap.data(), fallback);
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────
// Blog Posts  (stored as individual docs for easy CRUD)
// ─────────────────────────────────────────────────────────────

export type { BlogSeo };

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
  coverImageUrl?: string;
  thumbnailImageUrl?: string;
  seo?: BlogSeo;
}

/** Firestore rejects explicit `undefined` field values (e.g. empty coverImageUrl). */
function stripUndefinedShallow<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

function normalizeBlogPostForSave(post: BlogPost): Omit<BlogPost, 'id'> {
  const {
    id: _id,
    coverImageUrl: _cover,
    thumbnailImageUrl: _thumb,
    seo: _seo,
    ...data
  } = post;
  const tags = (data.tags ?? []).filter(Boolean).slice(0, 5);
  const coverImageUrl = post.coverImageUrl?.trim();
  const thumbnailImageUrl = post.thumbnailImageUrl?.trim();
  const seo = normalizeBlogSeo(post.seo);

  return stripUndefinedShallow({
    ...data,
    tags,
    ...(coverImageUrl ? { coverImageUrl } : {}),
    ...(thumbnailImageUrl ? { thumbnailImageUrl } : {}),
    ...(seo ? { seo } : {}),
  }) as Omit<BlogPost, 'id'>;
}

export async function getBlogs(): Promise<BlogPost[]> {
  const fallbackBlogs = (_blogsJson as unknown as BlogPost[]).map((p, i) => ({
    ...p,
    numericId: p.numericId ?? (p as { id?: number }).id ?? i + 1,
  }));

  if (isSupabaseContentEnabled()) {
    try {
      const remote = (await contentApi.fetchAdminBlogs()) as BlogPost[];
      return mergeBlogPostsWithFallback(fallbackBlogs, remote);
    } catch {
      return fallbackBlogs;
    }
  }

  const q = query(collection(db(), 'blog_posts'), orderBy('numericId', 'desc'));
  const snap = await getDocs(q);

  const firestoreBlogs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost));
  return mergeBlogPostsWithFallback(fallbackBlogs, firestoreBlogs);
}

/** Write any blog-data.json rows missing from Firestore (doc id `seed-<numericId>`). */
export async function syncBlogPostsFromSeed(): Promise<number> {
  return seedMissingFallbackBlogs();
}

async function seedMissingFallbackBlogs(): Promise<number> {
  if (isSupabaseContentEnabled()) {
    const existing = await getBlogs();
    const existingKeys = new Set(existing.map((p) => blogPostMergeKey(p)));
    const fallback = (_blogsJson as unknown as BlogPost[]).map((p, i) => ({
      ...p,
      numericId: p.numericId ?? (p as { id?: number }).id ?? i + 1,
    }));
    const missing = fallback.filter((post) => !existingKeys.has(blogPostMergeKey(post)));
    if (missing.length === 0) return 0;
    await Promise.all(
      missing.map(async (post) => {
        const { id, ...data } = post;
        const seedId = typeof id === 'string' && id.length > 0 ? `seed-${id}` : `seed-${data.numericId}`;
        await contentApi.saveAdminBlog({ ...data, id: seedId });
      }),
    );
    return missing.length;
  }

  const q = query(collection(db(), 'blog_posts'), orderBy('numericId', 'asc'));
  const snap = await getDocs(q);

  const existingKeys = new Set(
    snap.docs.map((d) => {
      const p = d.data() as BlogPost;
      return blogPostMergeKey(p);
    })
  );

  const fallback = (_blogsJson as unknown as BlogPost[]).map((p, i) => ({
    ...p,
    numericId: p.numericId ?? (p as { id?: number }).id ?? i + 1,
  }));

  const missing = fallback.filter((post) => !existingKeys.has(blogPostMergeKey(post)));
  if (missing.length === 0) return 0;

  await Promise.all(
    missing.map((post) => {
      const { id, ...data } = post;
      const seedId = typeof id === 'string' && id.length > 0 ? `seed-${id}` : `seed-${data.numericId}`;
      return setDoc(doc(db(), 'blog_posts', seedId), data);
    })
  );
  return missing.length;
}

async function ensureUniqueNumericId(
  data: Omit<BlogPost, 'id'>,
  excludeDocId?: string,
): Promise<void> {
  const existing = await getBlogs();
  const usedByOthers = new Set(
    existing
      .filter((p) => p.id !== excludeDocId)
      .map((p) => resolveBlogNumericId(p))
      .filter((n) => n > 0),
  );

  const current = resolveBlogNumericId(data);
  if (current <= 0 || usedByOthers.has(current)) {
    data.numericId = nextBlogNumericId(existing);
  } else {
    data.numericId = current;
  }
}

export async function saveBlog(post: BlogPost): Promise<string> {
  await seedMissingFallbackBlogs();
  invalidateBlogCache();

  if (isSupabaseContentEnabled()) {
    const data = normalizeBlogPostForSave(post);
    await ensureUniqueNumericId(data, post.id);
    const payload = post.id ? { ...data, id: post.id } : data;
    return contentApi.saveAdminBlog(payload);
  }

  if (post.id) {
    const { id } = post;
    const data = normalizeBlogPostForSave(post);
    await ensureUniqueNumericId(data, id);
    await setDoc(doc(db(), 'blog_posts', id), data);
    return id;
  }

  const data = normalizeBlogPostForSave(post);
  await ensureUniqueNumericId(data);
  const ref = await addDoc(collection(db(), 'blog_posts'), data);
  return ref.id;
}

export async function deleteBlog(id: string) {
  if (isSupabaseContentEnabled()) {
    await contentApi.deleteAdminBlog(id);
    invalidateBlogCache();
    return;
  }
  await deleteDoc(doc(db(), 'blog_posts', id));
  invalidateBlogCache();
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

export const getEngineeringSkills = (portfolioId: PortfolioId = DEFAULT_PORTFOLIO_ID) =>
  getArrayDoc<SkillCategory>(
    col(portfolioId, 'engineering_skills'),
    ENG_SKILLS_FALLBACKS[portfolioId]
  );
export const setEngineeringSkills = (portfolioId: PortfolioId, items: SkillCategory[]) =>
  setArrayDoc(col(portfolioId, 'engineering_skills'), items);

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

export const getProjects = async (portfolioId: PortfolioId = DEFAULT_PORTFOLIO_ID) => {
  const projects = await getArrayDoc<Project>(
    col(portfolioId, 'engineering_projects'),
    PROJECT_FALLBACKS[portfolioId]
  );
  return normalizeProjectLinks(projects);
};
export const setProjects = (portfolioId: PortfolioId, items: Project[]) =>
  setArrayDoc(col(portfolioId, 'engineering_projects'), items);

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

export const getSocialLinks = (portfolioId: PortfolioId = DEFAULT_PORTFOLIO_ID) =>
  getArrayDoc<SocialLink>(col(portfolioId, 'social_links'), _socialLinksJson as SocialLink[]);
export const setSocialLinks = (portfolioId: PortfolioId, items: SocialLink[]) =>
  setArrayDoc(col(portfolioId, 'social_links'), items);

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

export { ENGINEERING_HERO_DEFAULT } from './engineeringStaticDefaults';

export const getEngineeringHeroContent = (portfolioId: PortfolioId = DEFAULT_PORTFOLIO_ID) =>
  getObjectDoc<EngineeringHeroContent>(
    col(portfolioId, 'engineering_hero_content'),
    getHeroFallback(portfolioId)
  );
export const setEngineeringHeroContent = (portfolioId: PortfolioId, item: EngineeringHeroContent) =>
  setObjectDoc(col(portfolioId, 'engineering_hero_content'), item);

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

export const getEngineeringCommunityContent = (portfolioId: PortfolioId = DEFAULT_PORTFOLIO_ID) =>
  getObjectDoc<EngineeringCommunityContent>(
    col(portfolioId, 'engineering_community_content'),
    ENGINEERING_COMMUNITY_DEFAULT
  );
export const setEngineeringCommunityContent = (
  portfolioId: PortfolioId,
  item: EngineeringCommunityContent
) => setObjectDoc(col(portfolioId, 'engineering_community_content'), item);

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

export { ENGINEERING_ABOUT_DEFAULT } from './engineeringStaticDefaults';

export const getEngineeringAboutContent = (portfolioId: PortfolioId = DEFAULT_PORTFOLIO_ID) =>
  getObjectDoc<EngineeringAboutContent>(
    col(portfolioId, 'engineering_about_content'),
    getAboutFallback(portfolioId)
  );
export const setEngineeringAboutContent = (portfolioId: PortfolioId, item: EngineeringAboutContent) =>
  setObjectDoc(col(portfolioId, 'engineering_about_content'), item);

// ─────────────────────────────────────────────────────────────
// Engineering Skills & Technologies heading (singleton)
// ─────────────────────────────────────────────────────────────

export interface EngineeringSkillsMeta {
  headingLeft: string;
  headingMiddle: string;
  headingRight: string;
}

export { ENGINEERING_SKILLS_META_DEFAULT } from './engineeringStaticDefaults';

export const getEngineeringSkillsMeta = (portfolioId: PortfolioId = DEFAULT_PORTFOLIO_ID) =>
  getObjectDoc<EngineeringSkillsMeta>(
    col(portfolioId, 'engineering_skills_meta'),
    getSkillsMetaFallback(portfolioId)
  );
export const setEngineeringSkillsMeta = (portfolioId: PortfolioId, item: EngineeringSkillsMeta) =>
  setObjectDoc(col(portfolioId, 'engineering_skills_meta'), item);

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

export const getContactSectionContent = (portfolioId: PortfolioId = DEFAULT_PORTFOLIO_ID) =>
  getObjectDoc<ContactSectionContent>(
    col(portfolioId, 'contact_section_content'),
    CONTACT_SECTION_DEFAULT
  );
export const setContactSectionContent = (portfolioId: PortfolioId, item: ContactSectionContent) =>
  setObjectDoc(col(portfolioId, 'contact_section_content'), item);

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
    { icon: 'Github', href: 'https://github.com/pukujan', label: 'GitHub' },
    { icon: 'Linkedin', href: 'https://www.linkedin.com/in/pujan3645', label: 'LinkedIn' },
    { icon: 'Behance', href: 'https://www.behance.net/pujan3645', label: 'Behance' },
    { icon: 'Mail', href: 'mailto:pujan3645@gmail.com', label: 'Email' },
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
    { label: 'Case Study', href: '/case-studies/ekagajpatra', type: 'route' },
  ],
  copyrightText: 'Design Baker. All rights reserved.',
};

export const getFooterContent = (portfolioId: PortfolioId = DEFAULT_PORTFOLIO_ID) =>
  getObjectDoc<FooterContent>(col(portfolioId, 'footer_content'), FOOTER_CONTENT_DEFAULT);
export const setFooterContent = (portfolioId: PortfolioId, item: FooterContent) =>
  setObjectDoc(col(portfolioId, 'footer_content'), item);

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

export { RELEVANT_EXPERIENCE_DEFAULT } from './engineeringStaticDefaults';

export const getRelevantExperienceContent = (portfolioId: PortfolioId = DEFAULT_PORTFOLIO_ID) =>
  getObjectDoc<RelevantExperienceContent>(
    col(portfolioId, 'relevant_experience_content'),
    getExperienceFallback(portfolioId)
  );
export const setRelevantExperienceContent = (
  portfolioId: PortfolioId,
  item: RelevantExperienceContent
) => setObjectDoc(col(portfolioId, 'relevant_experience_content'), item);

// ─────────────────────────────────────────────────────────────
// Push repo JSON fallbacks → Firestore (admin + seed script)
// ─────────────────────────────────────────────────────────────

const SEED_PORTFOLIO_IDS: PortfolioId[] = [
  'default',
  'legal-workflow-engineer',
  'endtoend-engineer',
  'ai-engineer',
  'forward-deployed-engineer',
];

async function verifyPushedHero(portfolioId: PortfolioId): Promise<void> {
  const { getDoc } = await import('firebase/firestore');
  const collectionName = col(portfolioId, 'engineering_hero_content');
  const expected = getHeroFallback(portfolioId);
  const snap = await getDoc(doc(db(), collectionName, 'data'));

  if (!snap.exists()) {
    throw new Error(`Firestore doc missing after push: ${collectionName}`);
  }

  const hero = unwrapObjectFromFirestore(snap.data(), expected);
  if (!hero.titleLine1?.trim()) {
    throw new Error(
      `Push did not persist hero for "${portfolioId}". Check Firestore rules for ${collectionName}.`
    );
  }
}

/** Overwrite engineering CMS docs in Firestore with repo JSON fallbacks for one portfolio. */
export async function pushPortfolioDefaultsToFirestore(portfolioId: PortfolioId): Promise<void> {
  await Promise.all([
    setEngineeringHeroContent(portfolioId, getHeroFallback(portfolioId)),
    setEngineeringAboutContent(portfolioId, getAboutFallback(portfolioId)),
    setEngineeringSkillsMeta(portfolioId, getSkillsMetaFallback(portfolioId)),
    setRelevantExperienceContent(portfolioId, getExperienceFallback(portfolioId)),
    setProjects(portfolioId, PROJECT_FALLBACKS[portfolioId]),
    setEngineeringSkills(portfolioId, ENG_SKILLS_FALLBACKS[portfolioId]),
    setEngineeringCommunityContent(portfolioId, ENGINEERING_COMMUNITY_DEFAULT),
    setContactSectionContent(portfolioId, CONTACT_SECTION_DEFAULT),
    setFooterContent(portfolioId, FOOTER_CONTENT_DEFAULT),
    setSocialLinks(portfolioId, _socialLinksJson as SocialLink[]),
  ]);

  await verifyPushedHero(portfolioId);
}

export const PORTFOLIO_CONTENT_PUSH_EVENT = 'portfolio-content-pushed';

export function notifyPortfolioContentPushed() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PORTFOLIO_CONTENT_PUSH_EVENT));
  }
}

/** Push repo defaults for every portfolio route (same scope as `pnpm run seed:firestore`). */
export async function pushAllPortfolioDefaultsToFirestore(): Promise<PortfolioId[]> {
  for (const portfolioId of SEED_PORTFOLIO_IDS) {
    await pushPortfolioDefaultsToFirestore(portfolioId);
  }
  return SEED_PORTFOLIO_IDS;
}
