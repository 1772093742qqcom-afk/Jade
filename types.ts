import { ThreeElements } from '@react-three/fiber';

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

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      group: any;
      sphereGeometry: any;
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      meshPhysicalMaterial: any;
      ringGeometry: any;
      cylinderGeometry: any;
      planeGeometry: any;
      fog: any;
      ambientLight: any;
      spotLight: any;
      pointLight: any;
    }
  }
}