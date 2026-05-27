/** Public gallery item — extends media library rows with query-friendly metadata (#24). */
export type GalleryPhoto = {
  id: string;
  url: string;
  filename: string;
  slug: string;
  category: string;
  shortId: string;
  title: string;
  altText: string;
  metaTags: string[];
  notes: string | null;
  byteSize: number | null;
  createdAt: string;
};

export type GalleryFilter = {
  query: string;
  tag: string | null;
};
