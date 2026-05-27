import { useEffect, useMemo, useState } from 'react';
import { DEMO_GALLERY_PHOTOS } from '../data/demoGalleryAssets';
import { fetchPublicGalleryPhotos, isGalleryApiEnabled } from '../lib/photoGalleryApi';
import { matchesGalleryQuery } from '../lib/deriveGalleryMeta';
import type { GalleryFilter, GalleryPhoto } from '../types';

export function usePhotoGallery(filter: GalleryFilter) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(DEMO_GALLERY_PHOTOS);
  const [loading, setLoading] = useState(isGalleryApiEnabled());
  const [source, setSource] = useState<'demo' | 'api'>('demo');

  useEffect(() => {
    if (!isGalleryApiEnabled()) {
      setPhotos(DEMO_GALLERY_PHOTOS);
      setSource('demo');
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    void fetchPublicGalleryPhotos().then((apiPhotos) => {
      if (!active) return;
      if (apiPhotos.length > 0) {
        setPhotos(apiPhotos);
        setSource('api');
      } else {
        setPhotos(DEMO_GALLERY_PHOTOS);
        setSource('demo');
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of photos) for (const t of p.metaTags) set.add(t);
    return [...set].sort();
  }, [photos]);

  const filtered = useMemo(() => {
    return photos.filter((photo) => {
      if (filter.tag && !photo.metaTags.includes(filter.tag)) return false;
      return matchesGalleryQuery(photo, filter.query);
    });
  }, [photos, filter.query, filter.tag]);

  return { photos: filtered, allPhotos: photos, allTags, loading, source };
}
