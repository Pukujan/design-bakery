import communityWorkshopsGalleryJson from './gallery-community-workshops.json';
import prideCommunityGalleryJson from './gallery-pride-community.json';
import abstractCollageGalleryJson from './gallery-abstract-collage.json';
import mixedMediaGalleryJson from './gallery-mixed-media.json';
import posterArtGalleryJson from './gallery-poster-art.json';
import prideMonthGalleryJson from './gallery-pride-month.json';
import communityEventsGalleryJson from './gallery-community-events.json';

export interface GalleryItem {
  id: number;
  image: string;
  title: string;
  description: string;
  date: string;
  link?: string;
  comingSoon?: boolean;
}

export interface GalleryData {
  title: string;
  description: string;
  color: string;
  items: GalleryItem[];
}

export const communityWorkshopsGallery = communityWorkshopsGalleryJson as GalleryData;
export const prideCommunityGallery = prideCommunityGalleryJson as GalleryData;
export const abstractCollageGallery = abstractCollageGalleryJson as GalleryData;
export const mixedMediaGallery = mixedMediaGalleryJson as GalleryData;
export const posterArtGallery = posterArtGalleryJson as GalleryData;
export const prideMonthGallery = prideMonthGalleryJson as GalleryData;
export const communityEventsGallery = communityEventsGalleryJson as GalleryData;
