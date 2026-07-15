export interface PhotoSize {
  id: string;
  name: string;
  width: number;
  height: number;
  unit: 'cm' | 'mm' | 'in';
}

export const STANDARD_SIZES: PhotoSize[] = [
  { id: '3x4', name: '3 × 4 cm', width: 3, height: 4, unit: 'cm' },
  { id: '3.5x4.5', name: '3.5 × 4.5 cm', width: 3.5, height: 4.5, unit: 'cm' },
  { id: '4x6', name: '4 × 6 cm', width: 4, height: 6, unit: 'cm' },
  { id: '5x5', name: '5 × 5 cm (2" x 2")', width: 5, height: 5, unit: 'cm' },
  { id: '5x7', name: '5 × 7 cm', width: 5, height: 7, unit: 'cm' },
  { id: '6x8', name: '6 × 8 cm', width: 6, height: 8, unit: 'cm' },
  { id: '8x10', name: '8 × 10 cm', width: 8, height: 10, unit: 'cm' },
  { id: '9x12', name: '9 × 12 cm', width: 9, height: 12, unit: 'cm' },
  { id: '10x15', name: '10 × 15 cm (4" x 6")', width: 10, height: 15, unit: 'cm' },
  { id: '13x18', name: '13 × 18 cm (5" x 7")', width: 13, height: 18, unit: 'cm' },
  { id: '15x21', name: '15 × 21 cm', width: 15, height: 21, unit: 'cm' },
  { id: '20x30', name: '20 × 30 cm (8" x 12")', width: 20, height: 30, unit: 'cm' },
];

export interface TransformState {
  x: number;
  y: number;
  zoom: number;
  rotation: number; // in degrees
  flipH: boolean;
  flipV: boolean;
}

export interface FilterState {
  brightness: number;  // -100 to 100 (default 0)
  contrast: number;    // -100 to 100 (default 0)
  exposure: number;    // -100 to 100 (default 0)
  saturation: number;  // -100 to 100 (default 0)
  sharpness: number;   // 0 to 100 (default 0)
  temperature: number; // -100 to 100 (default 0)
  highlights: number;  // -100 to 100 (default 0)
  shadows: number;     // -100 to 100 (default 0)
  grayscale: boolean;
  sepia: boolean;
  blackWhite: boolean;
}

export interface BackgroundState {
  type: 'solid' | 'transparent';
  color: string; // hex code
}

export interface BgRemovalState {
  enabled: boolean;
  keyColor: [number, number, number] | null; // RGB
  tolerance: number; // 0 - 100
  feather: number; // 0 - 50
  useMask: boolean; // brush erase
}

export type FitMode = 'fit' | 'fill';
export type GuideType = 'none' | 'passport' | 'grid' | 'crosshair';

export interface EditorHistoryItem {
  transform: TransformState;
  filters: FilterState;
  fitMode: FitMode;
  backgroundColor: BackgroundState;
  bgRemoval: Omit<BgRemovalState, 'enabled'>;
  // We can store a serialized version or an image mask reference if necessary
}
