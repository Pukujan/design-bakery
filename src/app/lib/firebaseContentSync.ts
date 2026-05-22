import { get, ref, set } from 'firebase/database';
import { firebaseDbRoot, realtimeDb } from './firebase';

import socialLinks from '../components/social-links.json';
import timeline from '../modules/design/About/timeline.json';
import advocacyImages from '../modules/design/Advocacy/advocacy-images.json';
import artPieces from '../modules/design/ArtGallery/art-pieces.json';
import designBlogPosts from '../modules/design/Blog/blog-posts.json';
import galleryAbstractCollage from '../modules/design/DesignPortfolio/gallery-abstract-collage.json';
import galleryCommunityEvents from '../modules/design/DesignPortfolio/gallery-community-events.json';
import galleryCommunityWorkshops from '../modules/design/DesignPortfolio/gallery-community-workshops.json';
import galleryMixedMedia from '../modules/design/DesignPortfolio/gallery-mixed-media.json';
import galleryPosterArt from '../modules/design/DesignPortfolio/gallery-poster-art.json';
import galleryPrideCommunity from '../modules/design/DesignPortfolio/gallery-pride-community.json';
import galleryPrideMonth from '../modules/design/DesignPortfolio/gallery-pride-month.json';
import designSkills from '../modules/design/Skills/skills.json';
import showcaseAiProjects from '../modules/design/WebDesignShowcase/showcase-ai-projects.json';
import showcaseWebProjects from '../modules/design/WebDesignShowcase/showcase-web-projects.json';
import engineeringProjects from '../modules/engineering/EngineeringProjects/projects.json';
import engineeringSkillCategories from '../modules/engineering/EngineeringSkills/skill-categories.json';
import engineeringBlogCategories from '@/modules/blog/data/blog-categories.json';
import engineeringBlogData from '@/modules/blog/data/blog-data.json';

const CACHE_KEY = 'firebase-content-cache-v1';
const CACHE_META_KEY = 'firebase-content-cache-meta-v1';
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_SYNC_COOLDOWN_MS = 10 * 60 * 1000;

let inFlightSync: Promise<SyncResult> | null = null;

type ContentPayload = {
  shared: {
    socialLinks: typeof socialLinks;
  };
  design: {
    aboutTimeline: typeof timeline;
    advocacyImages: typeof advocacyImages;
    artPieces: typeof artPieces;
    blogPosts: typeof designBlogPosts;
    galleries: {
      abstractCollage: typeof galleryAbstractCollage;
      communityEvents: typeof galleryCommunityEvents;
      communityWorkshops: typeof galleryCommunityWorkshops;
      mixedMedia: typeof galleryMixedMedia;
      posterArt: typeof galleryPosterArt;
      prideCommunity: typeof galleryPrideCommunity;
      prideMonth: typeof galleryPrideMonth;
    };
    skills: typeof designSkills;
    showcase: {
      aiProjects: typeof showcaseAiProjects;
      webProjects: typeof showcaseWebProjects;
    };
  };
  engineering: {
    blogCategories: typeof engineeringBlogCategories;
    blogData: typeof engineeringBlogData;
    projects: typeof engineeringProjects;
    skillCategories: typeof engineeringSkillCategories;
  };
};

type CacheMeta = {
  hash: string;
  cachedAt: number;
  lastSyncAt: number;
};

type SyncResult = {
  status: 'uploaded' | 'skipped';
  reason: string;
  hash: string;
};

type LoadResult = {
  data: ContentPayload | null;
  source: 'cache' | 'firebase' | 'none';
};

function getPayload(): ContentPayload {
  return {
    shared: {
      socialLinks,
    },
    design: {
      aboutTimeline: timeline,
      advocacyImages,
      artPieces,
      blogPosts: designBlogPosts,
      galleries: {
        abstractCollage: galleryAbstractCollage,
        communityEvents: galleryCommunityEvents,
        communityWorkshops: galleryCommunityWorkshops,
        mixedMedia: galleryMixedMedia,
        posterArt: galleryPosterArt,
        prideCommunity: galleryPrideCommunity,
        prideMonth: galleryPrideMonth,
      },
      skills: designSkills,
      showcase: {
        aiProjects: showcaseAiProjects,
        webProjects: showcaseWebProjects,
      },
    },
    engineering: {
      blogCategories: engineeringBlogCategories,
      blogData: engineeringBlogData,
      projects: engineeringProjects,
      skillCategories: engineeringSkillCategories,
    },
  };
}

function hashString(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function getContentRootPath(): string {
  const root = firebaseDbRoot.trim();
  return root ? `${root.replace(/\/$/, '')}/content` : 'content';
}

function getNumberEnv(name: string, fallback: number): number {
  const raw = import.meta.env[name as keyof ImportMetaEnv];
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readCacheMeta(): CacheMeta | null {
  try {
    const raw = localStorage.getItem(CACHE_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CacheMeta;
  } catch {
    return null;
  }
}

function writeCache(payload: ContentPayload, hash: string, syncedAt: number): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    localStorage.setItem(
      CACHE_META_KEY,
      JSON.stringify({ hash, cachedAt: Date.now(), lastSyncAt: syncedAt } satisfies CacheMeta)
    );
  } catch {
    // Ignore cache write failures (quota/private mode).
  }
}

export function getCachedContent(): ContentPayload | null {
  const ttl = getNumberEnv('VITE_FIREBASE_CACHE_TTL_MS', DEFAULT_CACHE_TTL_MS);
  const meta = readCacheMeta();
  if (!meta || Date.now() - meta.cachedAt > ttl) return null;

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as ContentPayload) : null;
  } catch {
    return null;
  }
}

async function fetchContentFromFirebase(): Promise<ContentPayload | null> {
  if (!realtimeDb) return null;

  const rootPath = getContentRootPath();
  const snapshot = await get(ref(realtimeDb, rootPath));
  if (!snapshot.exists()) return null;

  const remoteValue = snapshot.val() as Partial<ContentPayload> & {
    __meta?: { hash?: string; updatedAt?: number };
  };

  const { __meta, ...payload } = remoteValue;
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const normalizedPayload = payload as ContentPayload;
  const hash = __meta?.hash ?? hashString(JSON.stringify(normalizedPayload));
  const syncedAt = __meta?.updatedAt ?? Date.now();
  writeCache(normalizedPayload, hash, syncedAt);
  return normalizedPayload;
}

export async function loadContentFromFirebase(options?: { preferCache?: boolean }): Promise<LoadResult> {
  const preferCache = options?.preferCache ?? true;
  const cached = getCachedContent();
  if (preferCache && cached) {
    return { data: cached, source: 'cache' };
  }

  const remote = await fetchContentFromFirebase();
  if (remote) {
    return { data: remote, source: 'firebase' };
  }

  if (cached) {
    return { data: cached, source: 'cache' };
  }

  return { data: null, source: 'none' };
}

export async function syncContentToFirebase(options?: { force?: boolean }): Promise<SyncResult> {
  if (inFlightSync) {
    return inFlightSync;
  }

  const task = (async (): Promise<SyncResult> => {
    if (!realtimeDb) {
      return { status: 'skipped', reason: 'firebase-not-configured', hash: '' };
    }

    const payload = getPayload();
    const payloadString = JSON.stringify(payload);
    const hash = hashString(payloadString);
    const now = Date.now();

    const cooldownMs = getNumberEnv('VITE_FIREBASE_SYNC_COOLDOWN_MS', DEFAULT_SYNC_COOLDOWN_MS);
    const meta = readCacheMeta();
    if (!options?.force && meta && now - meta.lastSyncAt < cooldownMs && meta.hash === hash) {
      return { status: 'skipped', reason: 'cooldown-active', hash };
    }

    const rootPath = getContentRootPath();
    const metaPath = `${rootPath}/__meta`;
    const remoteMetaSnapshot = await get(ref(realtimeDb, metaPath));
    const remoteMeta = remoteMetaSnapshot.exists()
      ? (remoteMetaSnapshot.val() as { hash?: string })
      : null;

    if (!options?.force && remoteMeta?.hash === hash) {
      writeCache(payload, hash, now);
      return { status: 'skipped', reason: 'already-up-to-date', hash };
    }

    await set(ref(realtimeDb, rootPath), {
      ...payload,
      __meta: {
        hash,
        updatedAt: now,
        source: 'design-bakery-web',
      },
    });

    writeCache(payload, hash, now);
    return { status: 'uploaded', reason: 'content-synced', hash };
  })();

  inFlightSync = task;

  try {
    return await task;
  } finally {
    inFlightSync = null;
  }
}
