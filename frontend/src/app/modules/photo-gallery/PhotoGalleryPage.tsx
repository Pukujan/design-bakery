import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BlogPageDecor } from '@/modules/blog/shared/BlogPageMotion';
import { GalleryHero } from './components/GalleryHero';
import { GalleryToolbar } from './components/GalleryToolbar';
import { GalleryMasonry } from './components/GalleryMasonry';
import { GalleryLightbox } from './components/GalleryLightbox';
import { usePhotoGallery } from './hooks/usePhotoGallery';
import type { GalleryFilter, GalleryPhoto } from './types';
import { galleryDetailPath } from './lib/photoGalleryApi';

export function PhotoGalleryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ category?: string; imageId?: string }>();
  const galleryBasePath = location.pathname.startsWith('/endtoend-engineer/')
    ? '/endtoend-engineer/gallery'
    : '/gallery';
  const galleryPrefix = galleryBasePath.startsWith('/endtoend-engineer')
    ? '/endtoend-engineer'
    : '';

  const [filter, setFilter] = useState<GalleryFilter>({ query: '', tag: null });
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);
  const [toast, setToast] = useState('');
  const { photos, allTags, loading, source } = usePhotoGallery(filter);

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setToast('Link copied');
    window.setTimeout(() => setToast(''), 2000);
  }

  useEffect(() => {
    if (!params.imageId || photos.length === 0) return;
    const matched = photos.find(
      (p) =>
        p.shortId === params.imageId &&
        (!params.category || p.category === params.category),
    );
    if (matched) setLightboxPhoto(matched);
  }, [params.imageId, params.category, photos]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-violet-100 via-fuchsia-50 to-sky-100 px-4 pb-16 pt-28 dark:from-violet-950 dark:via-fuchsia-950 dark:to-sky-950 sm:px-6 md:pt-32">
      <BlogPageDecor variant="list" seed="photo-gallery" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <GalleryHero total={photos.length} source={source} />
        <GalleryToolbar
          filter={filter}
          onFilterChange={setFilter}
          allTags={allTags}
          resultCount={photos.length}
        />

        {loading ? (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.1 }}
                className="mb-4 h-64 break-inside-avoid rounded-2xl border-3 border-black/20 bg-white/70 dark:bg-gray-900/70"
              />
            ))}
          </div>
        ) : (
          <GalleryMasonry
            photos={photos}
            onOpen={(photo) => {
              setLightboxPhoto(photo);
              navigate(galleryDetailPath(photo, galleryPrefix), { replace: false });
            }}
            onCopyUrl={(url) => void copyUrl(url)}
            pathPrefix={galleryPrefix}
          />
        )}
      </div>

      <GalleryLightbox
        photo={lightboxPhoto}
        photos={photos}
        onClose={() => {
          setLightboxPhoto(null);
          navigate(galleryBasePath, { replace: false });
        }}
        onNavigate={(photo) => {
          setLightboxPhoto(photo);
          navigate(galleryDetailPath(photo, galleryPrefix), { replace: true });
        }}
        onCopyUrl={(url) => void copyUrl(url)}
        toast={toast}
      />
    </section>
  );
}
