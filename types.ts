export interface StarData {
  id: number;
  position: [number, number, number];
  images: string[]; // Runtime Blob URLs (used for display)
  imageAssetIds?: string[]; // Persisted IndexedDB IDs (used for saving/loading)
  text?: string;
  isActive: boolean;
  viewCount: number; // To track how many times it has been opened
}

export interface Song {
  id: string;
  name: string;
  url: string; // Runtime Blob URL
  assetId?: string; // Persisted IndexedDB ID
}

export interface OceanProps {
  stars: StarData[];
  onStarClick: (id: number) => void;
}