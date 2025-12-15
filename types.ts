export interface StarData {
  id: number;
  position: [number, number, number];
  images: string[]; // Changed from single optional image to array
  text?: string;
  isActive: boolean;
  viewCount: number; // To track how many times it has been opened
}

export interface Song {
  id: string;
  name: string;
  url: string;
}

export interface OceanProps {
  stars: StarData[];
  onStarClick: (id: number) => void;
}