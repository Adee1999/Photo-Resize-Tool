import { create } from 'zustand';
import {
  PhotoSize,
  STANDARD_SIZES,
  TransformState,
  FilterState,
  BackgroundState,
  BgRemovalState,
  FitMode,
  GuideType,
} from '../types/editor';

interface FileInfo {
  name: string;
  size: number;
  type: string;
}

interface EditorState {
  // Image Source & Metadata
  imageSrc: string | null;
  fileInfo: FileInfo | null;
  imageWidth: number;
  imageHeight: number;

  // Editor Settings & Positioning
  transform: TransformState;
  filters: FilterState;
  fitMode: FitMode;
  backgroundColor: BackgroundState;
  bgRemoval: BgRemovalState;
  guideType: GuideType;

  // Size Options
  selectedSize: PhotoSize;
  customSize: Omit<PhotoSize, 'id'>;
  isCustomSize: boolean;
  exportResolution: 300 | 600 | 900; // PPI

  // Brush Mask Canvas for precise manual erasing
  maskCanvas: HTMLCanvasElement | null;

  // History for Undo/Redo
  history: Array<{
    transform: TransformState;
    filters: FilterState;
    fitMode: FitMode;
    backgroundColor: BackgroundState;
    bgRemoval: Omit<BgRemovalState, 'enabled' | 'maskCanvas'>;
    selectedSize: PhotoSize;
    isCustomSize: boolean;
    customSize: Omit<PhotoSize, 'id'>;
    // We can also store serialized mask data if needed, or we will just back it up
    maskData: string | null; // dataURL of the mask canvas
  }>;
  historyIndex: number;

  // Actions
  setImage: (src: string | null, fileInfo: FileInfo | null, width?: number, height?: number) => void;
  setTransform: (transform: Partial<TransformState>) => void;
  resetTransform: () => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setAutoEnhance: (enabled: boolean) => void;
  setBackground: (bg: Partial<BackgroundState>) => void;
  setBgRemoval: (bgRemoval: Partial<BgRemovalState>) => void;
  setFitMode: (mode: FitMode) => void;
  setGuideType: (type: GuideType) => void;
  setSize: (size: PhotoSize) => void;
  setCustomSize: (size: Partial<Omit<PhotoSize, 'id'>>) => void;
  setIsCustomSize: (isCustom: boolean) => void;
  setResolution: (resolution: 300 | 600 | 900) => void;
  setMaskCanvas: (canvas: HTMLCanvasElement | null) => void;

  // History Actions
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  resetAll: () => void;
}

const initialTransform: TransformState = {
  x: 0,
  y: 0,
  zoom: 1,
  rotation: 0,
  flipH: false,
  flipV: false,
};

const initialFilters: FilterState = {
  brightness: 0,
  contrast: 0,
  exposure: 0,
  saturation: 0,
  sharpness: 0,
  temperature: 0,
  highlights: 0,
  shadows: 0,
  grayscale: false,
  sepia: false,
  blackWhite: false,
};

const initialBackground: BackgroundState = {
  type: 'solid',
  color: '#FFFFFF',
};

const initialBgRemoval: BgRemovalState = {
  enabled: false,
  keyColor: null,
  tolerance: 15,
  feather: 2,
  useMask: false,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  imageSrc: null,
  fileInfo: null,
  imageWidth: 0,
  imageHeight: 0,

  transform: { ...initialTransform },
  filters: { ...initialFilters },
  fitMode: 'fill',
  backgroundColor: { ...initialBackground },
  bgRemoval: { ...initialBgRemoval },
  guideType: 'none',

  selectedSize: STANDARD_SIZES[0], // default 3x4 cm
  customSize: { name: 'Custom Size', width: 3, height: 4, unit: 'cm' },
  isCustomSize: false,
  exportResolution: 300,

  maskCanvas: null,

  history: [],
  historyIndex: -1,

  setImage: (src, fileInfo, width = 0, height = 0) => {
    set({
      imageSrc: src,
      fileInfo,
      imageWidth: width,
      imageHeight: height,
      transform: { ...initialTransform },
      filters: { ...initialFilters },
      backgroundColor: { ...initialBackground },
      bgRemoval: { ...initialBgRemoval },
      maskCanvas: null,
      history: [],
      historyIndex: -1,
    });
  },

  setTransform: (transform) => {
    set((state) => ({
      transform: { ...state.transform, ...transform },
    }));
  },

  resetTransform: () => {
    get().pushHistory();
    set({ transform: { ...initialTransform } });
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  resetFilters: () => {
    get().pushHistory();
    set({ filters: { ...initialFilters } });
  },

  setAutoEnhance: (enabled) => {
    get().pushHistory();
    if (enabled) {
      set({
        filters: {
          ...initialFilters,
          brightness: 5,
          contrast: 15,
          saturation: 10,
          exposure: 5,
          highlights: -5,
          shadows: 10,
          sharpness: 25,
        },
      });
    } else {
      set({ filters: { ...initialFilters } });
    }
  },

  setBackground: (bg) => {
    set((state) => ({
      backgroundColor: { ...state.backgroundColor, ...bg },
    }));
  },

  setBgRemoval: (bgRemoval) => {
    set((state) => ({
      bgRemoval: { ...state.bgRemoval, ...bgRemoval },
    }));
  },

  setFitMode: (fitMode) => {
    get().pushHistory();
    set({ fitMode });
  },

  setGuideType: (guideType) => {
    set({ guideType });
  },

  setSize: (selectedSize) => {
    get().pushHistory();
    set({ selectedSize, isCustomSize: false });
  },

  setCustomSize: (customSize) => {
    set((state) => ({
      customSize: { ...state.customSize, ...customSize },
    }));
  },

  setIsCustomSize: (isCustomSize) => {
    get().pushHistory();
    set({ isCustomSize });
  },

  setResolution: (exportResolution) => {
    set({ exportResolution });
  },

  setMaskCanvas: (maskCanvas) => {
    set({ maskCanvas });
  },

  pushHistory: () => {
    const {
      transform,
      filters,
      fitMode,
      backgroundColor,
      bgRemoval,
      selectedSize,
      isCustomSize,
      customSize,
      maskCanvas,
      history,
      historyIndex,
    } = get();

    // Serialize mask canvas state
    let maskData: string | null = null;
    if (maskCanvas) {
      maskData = maskCanvas.toDataURL();
    }

    // Cut off any redo history if we were in the middle of undo stack
    const newHistory = history.slice(0, historyIndex + 1);

    const historyItem = {
      transform: { ...transform },
      filters: { ...filters },
      fitMode,
      backgroundColor: { ...backgroundColor },
      bgRemoval: {
        enabled: bgRemoval.enabled,
        keyColor: bgRemoval.keyColor ? [...bgRemoval.keyColor] as [number, number, number] : null,
        tolerance: bgRemoval.tolerance,
        feather: bgRemoval.feather,
        useMask: bgRemoval.useMask,
      },
      selectedSize: { ...selectedSize },
      isCustomSize,
      customSize: { ...customSize },
      maskData,
    };

    set({
      history: [...newHistory, historyItem],
      historyIndex: newHistory.length,
    });
  },

  undo: () => {
    const { history, historyIndex, maskCanvas } = get();
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const state = history[prevIndex];

      // Restore mask canvas if stored
      if (maskCanvas && state.maskData) {
        const ctx = maskCanvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.src = state.maskData;
          img.onload = () => {
            ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
            ctx.drawImage(img, 0, 0);
          };
        }
      }

      set({
        transform: state.transform,
        filters: state.filters,
        fitMode: state.fitMode,
        backgroundColor: state.backgroundColor,
        bgRemoval: {
          ...get().bgRemoval,
          ...state.bgRemoval,
        },
        selectedSize: state.selectedSize,
        isCustomSize: state.isCustomSize,
        customSize: state.customSize,
        historyIndex: prevIndex,
      });
    }
  },

  redo: () => {
    const { history, historyIndex, maskCanvas } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const state = history[nextIndex];

      // Restore mask canvas if stored
      if (maskCanvas && state.maskData) {
        const ctx = maskCanvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.src = state.maskData;
          img.onload = () => {
            ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
            ctx.drawImage(img, 0, 0);
          };
        }
      }

      set({
        transform: state.transform,
        filters: state.filters,
        fitMode: state.fitMode,
        backgroundColor: state.backgroundColor,
        bgRemoval: {
          ...get().bgRemoval,
          ...state.bgRemoval,
        },
        selectedSize: state.selectedSize,
        isCustomSize: state.isCustomSize,
        customSize: state.customSize,
        historyIndex: nextIndex,
      });
    }
  },

  clearHistory: () => {
    set({
      history: [],
      historyIndex: -1,
    });
  },

  resetAll: () => {
    set({
      imageSrc: null,
      fileInfo: null,
      imageWidth: 0,
      imageHeight: 0,
      transform: { ...initialTransform },
      filters: { ...initialFilters },
      fitMode: 'fill',
      backgroundColor: { ...initialBackground },
      bgRemoval: { ...initialBgRemoval },
      guideType: 'none',
      selectedSize: STANDARD_SIZES[0],
      customSize: { name: 'Custom Size', width: 3, height: 4, unit: 'cm' },
      isCustomSize: false,
      exportResolution: 300,
      maskCanvas: null,
      history: [],
      historyIndex: -1,
    });
  },
}));
