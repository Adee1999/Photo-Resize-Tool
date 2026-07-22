import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { processImage, autoDetectBackgroundColor } from '../utils/canvasFilters';
import { GuideType, FitMode } from '../types/editor';
import { Move, ZoomIn, ZoomOut, RotateCw, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface PhotoEditorCanvasProps {
  brushMode: boolean;
  brushType: 'erase' | 'restore';
  brushSize: number;
  eyedropperActive: boolean;
  setEyedropperActive: (active: boolean) => void;
  onAutoDetectBg: (color: [number, number, number]) => void;
}

export default function PhotoEditorCanvas({
  brushMode,
  brushType,
  brushSize,
  eyedropperActive,
  setEyedropperActive,
  onAutoDetectBg,
}: PhotoEditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    imageSrc,
    transform,
    filters,
    fitMode,
    backgroundColor,
    bgRemoval,
    guideType,
    selectedSize,
    customSize,
    isCustomSize,
    maskCanvas,
    maskVersion,
    setTransform,
    setMaskCanvas,
    bumpMaskVersion,
    setBgRemoval,
    pushHistory,
  } = useEditorStore();

  // Loaded HTML Image element
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  // Offscreen canvas where the image + filters + background removal is pre-rendered for 60 FPS performance
  const [processedCanvas, setProcessedCanvas] = useState<HTMLCanvasElement | null>(null);
  // Dimensions of the viewport
  const [dimensions, setDimensions] = useState({ width: 600, height: 450 });

  // Mouse interaction state
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const transformStart = useRef({ x: 0, y: 0 });
  const prevBrushPos = useRef<{ x: number; y: number } | null>(null);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef(1);

  // Measure container and handle resizes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 300),
          height: Math.max(height, 300),
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Load image when imageSrc changes
  useEffect(() => {
    if (!imageSrc) {
      setImageEl(null);
      setProcessedCanvas(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      setImageEl(img);

      // Create a clean mask canvas matching original image dimensions
      const mCanvas = document.createElement('canvas');
      mCanvas.width = img.naturalWidth;
      mCanvas.height = img.naturalHeight;
      const mCtx = mCanvas.getContext('2d');
      if (mCtx) {
        mCtx.fillStyle = '#FFFFFF';
        mCtx.fillRect(0, 0, mCanvas.width, mCanvas.height);
      }
      setMaskCanvas(mCanvas);

      // Detect background color
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 300;
      tempCanvas.height = Math.round((300 * img.naturalHeight) / img.naturalWidth);
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
        const detectedColor = autoDetectBackgroundColor(tempCanvas);
        onAutoDetectBg(detectedColor);
      }
    };
  }, [imageSrc, setMaskCanvas, onAutoDetectBg]);

  // Re-run filter/mask processing and update processedCanvas only when inputs change
  // This isolates expensive image filters from fast layout/drag render loops!
  useEffect(() => {
    if (!imageEl || !imageSrc) return;

    const updateProcessedCanvas = () => {
      const processed = processImage(
        imageEl,
        filters,
        bgRemoval.enabled,
        bgRemoval.keyColor,
        bgRemoval.tolerance,
        bgRemoval.feather,
        maskCanvas
      );
      setProcessedCanvas(processed);
    };

    // Debounce processing slightly if filters are moving rapidly
    const timeout = setTimeout(updateProcessedCanvas, 15);
    return () => clearTimeout(timeout);
    // NOTE: maskCanvas is a stable HTMLCanvasElement reference that is mutated
    // in-place by brush strokes (see executeBrushStroke), so its identity never
    // changes. We depend on maskVersion instead, which is bumped on every
    // stroke, to make sure this effect re-runs and the erased/restored pixels
    // actually show up on screen.
  }, [imageEl, imageSrc, filters, bgRemoval.enabled, bgRemoval.keyColor, bgRemoval.tolerance, bgRemoval.feather, maskCanvas, maskVersion]);

  // Get active crop box dimension (Width and Height in physical units)
  const getPhysicalSize = useCallback(() => {
    if (isCustomSize) {
      return customSize;
    }
    return selectedSize;
  }, [isCustomSize, selectedSize, customSize]);

  // Map workspace mouse click coordinates to natural image pixels using Inverse Transform
  const getPixelCoord = useCallback((mx: number, my: number) => {
    if (!canvasRef.current || !imageEl) return null;

    const phys = getPhysicalSize();
    const ar = phys.width / phys.height;

    const W = dimensions.width;
    const H = dimensions.height;

    // Calculate crop dimensions centered in the canvas
    let cropWidth = W * 0.8;
    let cropHeight = cropWidth / ar;

    if (cropHeight > H * 0.8) {
      cropHeight = H * 0.8;
      cropWidth = cropHeight * ar;
    }

    const cropX = (W - cropWidth) / 2;
    const cropY = (H - cropHeight) / 2;

    const centerX = cropX + cropWidth / 2;
    const centerY = cropY + cropHeight / 2;

    // Inverse Translation
    let x1 = mx - centerX;
    let y1 = my - centerY;

    // Inverse pan offset
    x1 -= transform.x;
    y1 -= transform.y;

    // Inverse Rotation
    const rad = (-transform.rotation * Math.PI) / 180;
    const x3 = x1 * Math.cos(rad) - y1 * Math.sin(rad);
    const y3 = x1 * Math.sin(rad) + y1 * Math.cos(rad);

    // Base scale
    const baseScaleX = cropWidth / imageEl.naturalWidth;
    const baseScaleY = cropHeight / imageEl.naturalHeight;
    const baseScale = fitMode === 'fit' ? Math.min(baseScaleX, baseScaleY) : Math.max(baseScaleX, baseScaleY);

    // Zoom and Flips
    const scaleX = baseScale * transform.zoom * (transform.flipH ? -1 : 1);
    const scaleY = baseScale * transform.zoom * (transform.flipV ? -1 : 1);

    const x4 = x3 / scaleX;
    const y4 = y3 / scaleY;

    // Translate back to top-left of image
    const pixelX = Math.round(x4 + imageEl.naturalWidth / 2);
    const pixelY = Math.round(y4 + imageEl.naturalHeight / 2);

    return { x: pixelX, y: pixelY };
  }, [dimensions, getPhysicalSize, transform, fitMode, imageEl]);

  // Ratio that converts an on-screen (workspace) pixel length into the
  // equivalent length in the original image's natural pixel space. Used so
  // the brush eraser feels like a constant on-screen size regardless of the
  // photo's actual resolution or the current zoom level.
  const getWorkspaceToNaturalScale = useCallback(() => {
    if (!imageEl) return 1;

    const phys = getPhysicalSize();
    const ar = phys.width / phys.height;

    const W = dimensions.width;
    const H = dimensions.height;

    let cropWidth = W * 0.8;
    let cropHeight = cropWidth / ar;
    if (cropHeight > H * 0.8) {
      cropHeight = H * 0.8;
      cropWidth = cropHeight * ar;
    }

    const baseScaleX = cropWidth / imageEl.naturalWidth;
    const baseScaleY = cropHeight / imageEl.naturalHeight;
    const baseScale = fitMode === 'fit' ? Math.min(baseScaleX, baseScaleY) : Math.max(baseScaleX, baseScaleY);

    const onScreenScale = baseScale * transform.zoom;
    return onScreenScale > 0 ? 1 / onScreenScale : 1;
  }, [dimensions, getPhysicalSize, fitMode, transform.zoom, imageEl]);

  // Main draw render loop (runs on requestAnimationFrame or whenever layout/transform updates)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    const W = dimensions.width;
    const H = dimensions.height;

    // Set canvas internal dimensions matching high-DPI display if possible, or 1:1 for simplicity
    canvas.width = W;
    canvas.height = H;

    if (!imageEl) {
      // Draw empty canvas instructions
      ctx.fillStyle = '#64748b';
      ctx.font = '15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Өңдеуді бастау үшін фото жүктеңіз', W / 2, H / 2);
      return;
    }

    const phys = getPhysicalSize();
    const ar = phys.width / phys.height;

    // Calculate crop box centered in canvas (using max 80% viewport)
    let cropWidth = W * 0.8;
    let cropHeight = cropWidth / ar;

    if (cropHeight > H * 0.8) {
      cropHeight = H * 0.8;
      cropWidth = cropHeight * ar;
    }

    const cropX = (W - cropWidth) / 2;
    const cropY = (H - cropHeight) / 2;

    const centerX = cropX + cropWidth / 2;
    const centerY = cropY + cropHeight / 2;

    // --- Step 1: Draw background inside crop box ---
    ctx.save();
    ctx.beginPath();
    ctx.rect(cropX, cropY, cropWidth, cropHeight);
    ctx.clip(); // clip to ensure background only paints inside crop box

    if (backgroundColor.type === 'solid') {
      ctx.fillStyle = backgroundColor.color;
      ctx.fillRect(cropX, cropY, cropWidth, cropHeight);
    } else {
      // Draw standard checkerboard transparent pattern
      const size = 12;
      for (let x = cropX; x < cropX + cropWidth; x += size) {
        for (let y = cropY; y < cropY + cropHeight; y += size) {
          const isEven = (Math.floor(x / size) + Math.floor(y / size)) % 2 === 0;
          ctx.fillStyle = isEven ? '#FFFFFF' : '#E2E8F0';
          ctx.fillRect(
            x,
            y,
            Math.min(size, cropX + cropWidth - x),
            Math.min(size, cropY + cropHeight - y)
          );
        }
      }
    }
    ctx.restore();

    // --- Step 2: Draw the processed image ---
    if (processedCanvas) {
      ctx.save();
      // Translate and transform image centered around crop box center
      ctx.translate(centerX, centerY);
      ctx.translate(transform.x, transform.y);
      ctx.rotate((transform.rotation * Math.PI) / 180);

      // Base scale matching FIT or FILL modes
      const baseScaleX = cropWidth / imageEl.naturalWidth;
      const baseScaleY = cropHeight / imageEl.naturalHeight;
      const baseScale = fitMode === 'fit' ? Math.min(baseScaleX, baseScaleY) : Math.max(baseScaleX, baseScaleY);

      const flipX = transform.flipH ? -1 : 1;
      const flipY = transform.flipV ? -1 : 1;

      ctx.scale(baseScale * transform.zoom * flipX, baseScale * transform.zoom * flipY);

      // Draw image centered on its transform center
      ctx.drawImage(processedCanvas, -imageEl.naturalWidth / 2, -imageEl.naturalHeight / 2);
      ctx.restore();
    }

    // --- Step 3: Draw out-of-bounds dimmed crop frame overlay ---
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)'; // Dim bleed out area
    ctx.beginPath();
    // Clockwise path around entire canvas
    ctx.rect(0, 0, W, H);
    // Counter-clockwise path around crop box (creates hole)
    ctx.rect(cropX, cropY + cropHeight, cropWidth, -cropHeight);
    ctx.fill();
    ctx.restore();

    // --- Step 4: Draw Crop border ---
    ctx.save();
    ctx.strokeStyle = '#2563EB'; // Blue-600
    ctx.lineWidth = 2.5;
    ctx.strokeRect(cropX, cropY, cropWidth, cropHeight);
    
    // Tiny outer corner accents to look professional
    ctx.fillStyle = '#2563EB';
    const accentSize = 8;
    ctx.fillRect(cropX - 2, cropY - 2, accentSize, accentSize);
    ctx.fillRect(cropX + cropWidth - accentSize + 2, cropY - 2, accentSize, accentSize);
    ctx.fillRect(cropX - 2, cropY + cropHeight - accentSize + 2, accentSize, accentSize);
    ctx.fillRect(cropX + cropWidth - accentSize + 2, cropY + cropHeight - accentSize + 2, accentSize, accentSize);
    ctx.restore();

    // --- Step 5: Draw Guides ---
    if (guideType !== 'none') {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      if (guideType === 'grid') {
        // Draw standard rule of thirds grid
        ctx.beginPath();
        // Verticals
        ctx.moveTo(cropX + cropWidth / 3, cropY);
        ctx.lineTo(cropX + cropWidth / 3, cropY + cropHeight);
        ctx.moveTo(cropX + (cropWidth * 2) / 3, cropY);
        ctx.lineTo(cropX + (cropWidth * 2) / 3, cropY + cropHeight);
        // Horizontals
        ctx.moveTo(cropX, cropY + cropHeight / 3);
        ctx.lineTo(cropX + cropWidth, cropY + cropHeight / 3);
        ctx.moveTo(cropX, cropY + (cropHeight * 2) / 3);
        ctx.lineTo(cropX + cropWidth, cropY + (cropHeight * 2) / 3);
        ctx.stroke();
      } else if (guideType === 'crosshair') {
        // Center crosshairs
        ctx.beginPath();
        ctx.moveTo(cropX + cropWidth / 2, cropY);
        ctx.lineTo(cropX + cropWidth / 2, cropY + cropHeight);
        ctx.moveTo(cropX, cropY + cropHeight / 2);
        ctx.lineTo(cropX + cropWidth, cropY + cropHeight / 2);
        ctx.stroke();
      } else if (guideType === 'passport') {
        // Biometric passport overlay
        // Draws precise face contour, hair alignment lines, eye lines based on ISO/IEC standards
        ctx.restore(); // cancel dashes for smooth portrait guidelines
        ctx.save();
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)'; // Amber gold guideline
        ctx.lineWidth = 1.5;
        
        const faceCenterX = cropX + cropWidth / 2;
        const faceCenterY = cropY + cropHeight * 0.45; // Face usually centered in upper half
        const headWidth = cropWidth * 0.45;
        const headHeight = cropHeight * 0.50;

        // Draw oval for Head Shape
        ctx.beginPath();
        ctx.ellipse(faceCenterX, faceCenterY, headWidth / 2, headHeight / 2, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Draw Eye Level Line
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(cropX, faceCenterY - headHeight * 0.08); // Eyes are slightly above center
        ctx.lineTo(cropX + cropWidth, faceCenterY - headHeight * 0.08);
        
        // Draw Chin Level Line
        ctx.moveTo(cropX, faceCenterY + headHeight / 2);
        ctx.lineTo(cropX + cropWidth, faceCenterY + headHeight / 2);

        // Draw Crown (top of head) Level Line
        ctx.moveTo(cropX, faceCenterY - headHeight / 2);
        ctx.lineTo(cropX + cropWidth, faceCenterY - headHeight / 2);

        ctx.stroke();
      }
      ctx.restore();
    }
  }, [dimensions, imageEl, processedCanvas, transform, fitMode, backgroundColor, bgRemoval, guideType, getPhysicalSize]);

  // Execute drawing stroke on manual mask canvas
  const executeBrushStroke = useCallback((x: number, y: number, prevX: number | null, prevY: number | null) => {
    if (!maskCanvas || !imageEl) return;

    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (brushType === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0, 0, 0, 1.0)';
      ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#FFFFFF';
      ctx.fillStyle = '#FFFFFF';
    }

    // Brush size scaled relative to the image's natural coordinates, so a
    // "40px" brush erases the same visual area on screen no matter how large
    // the source photo or the current zoom level is.
    const size = brushSize * getWorkspaceToNaturalScale();

    ctx.lineWidth = size;
    ctx.beginPath();

    if (prevX !== null && prevY !== null) {
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // The maskCanvas element reference never changes when we paint on it
    // in-place, so bump a version counter to let subscribers (the processed
    // canvas recompute effect) know the pixels actually changed.
    bumpMaskVersion();
  }, [maskCanvas, imageEl, brushType, brushSize, getWorkspaceToNaturalScale, bumpMaskVersion]);

  // Handle Mouse Down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handlePointerDown(e.clientX, e.clientY);
  };

  // Shared pan/brush/eyedropper start logic used by both mouse and touch input
  const handlePointerDown = (clientXRaw: number, clientYRaw: number) => {
    if (!imageEl) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = clientXRaw - rect.left;
    const clientY = clientYRaw - rect.top;

    if (eyedropperActive) {
      // Color-picking background color
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        // Read color at the clicked workspace pixel
        const imgData = ctx.getImageData(clientX, clientY, 1, 1);
        const [r, g, b] = imgData.data;
        
        // Push current state to undo stack before change
        pushHistory();

        setBgRemoval({
          enabled: true,
          keyColor: [r, g, b],
        });
        setEyedropperActive(false);
      }
      return;
    }

    if (brushMode) {
      // Paint mask canvas
      setIsDragging(true);
      const pixelPos = getPixelCoord(clientX, clientY);
      if (pixelPos) {
        pushHistory(); // push undo state
        executeBrushStroke(pixelPos.x, pixelPos.y, null, null);
        prevBrushPos.current = pixelPos;
      }
    } else {
      // Pan image position
      setIsDragging(true);
      dragStart.current = { x: clientX, y: clientY };
      transformStart.current = { x: transform.x, y: transform.y };
    }
  };

  // Handle Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handlePointerMove(e.clientX, e.clientY);
  };

  // Shared pan/brush move logic used by both mouse and touch input
  const handlePointerMove = (clientXRaw: number, clientYRaw: number) => {
    if (!isDragging || !imageEl) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = clientXRaw - rect.left;
    const clientY = clientYRaw - rect.top;

    if (brushMode) {
      const pixelPos = getPixelCoord(clientX, clientY);
      if (pixelPos && prevBrushPos.current) {
        executeBrushStroke(pixelPos.x, pixelPos.y, prevBrushPos.current.x, prevBrushPos.current.y);
        prevBrushPos.current = pixelPos;
      }
    } else {
      const dx = clientX - dragStart.current.x;
      const dy = clientY - dragStart.current.y;
      
      setTransform({
        x: transformStart.current.x + dx,
        y: transformStart.current.y + dy,
      });
    }
  };

  // Handle Mouse Up
  const handleMouseUp = () => {
    handlePointerUp();
  };

  // Shared pan/brush end logic used by both mouse and touch input
  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      prevBrushPos.current = null;
      if (!brushMode) {
        pushHistory(); // push history after dragging finishes
      }
    }
  };

  // Distance between two touch points, used for pinch-to-zoom
  const getTouchDistance = (touches: React.TouchList) => {
    const [t1, t2] = [touches[0], touches[1]];
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  // Handle Touch Start (single finger = pan/brush, two fingers = pinch zoom)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!imageEl) return;

    if (e.touches.length === 2) {
      // Starting a pinch gesture takes priority over any single-finger drag
      setIsDragging(false);
      prevBrushPos.current = null;
      pinchStartDist.current = getTouchDistance(e.touches);
      pinchStartZoom.current = transform.zoom;
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handlePointerDown(touch.clientX, touch.clientY);
    }
  };

  // Handle Touch Move
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Prevent the page from scrolling/zooming while interacting with the canvas
    e.preventDefault();

    if (e.touches.length === 2 && pinchStartDist.current) {
      const newDist = getTouchDistance(e.touches);
      const scale = newDist / pinchStartDist.current;
      const newZoom = Math.max(0.1, Math.min(15, pinchStartZoom.current * scale));
      setTransform({ zoom: newZoom });
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handlePointerMove(touch.clientX, touch.clientY);
    }
  };

  // Handle Touch End
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) {
      pinchStartDist.current = null;
      handlePointerUp();
    }
  };

  // Handle Mouse Wheel for zooming
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!imageEl) return;
    
    // Disable standard page scroll inside editor canvas
    e.preventDefault();

    const zoomStep = 0.08;
    const direction = e.deltaY < 0 ? 1 : -1;
    const newZoom = Math.max(0.1, Math.min(15, transform.zoom + direction * zoomStep));

    setTransform({ zoom: newZoom });

    // Debounced history push for zoom to prevent saturating undo stack
    const zoomHistoryTimer = (window as any).zoomHistoryTimer;
    if (zoomHistoryTimer) clearTimeout(zoomHistoryTimer);
    (window as any).zoomHistoryTimer = setTimeout(() => {
      pushHistory();
    }, 400);
  };

  // Canvas utility navigation buttons
  const adjustZoom = (factor: number) => {
    pushHistory();
    setTransform({ zoom: Math.max(0.1, Math.min(15, transform.zoom * factor)) });
  };

  const rotate90 = () => {
    pushHistory();
    setTransform({ rotation: (transform.rotation + 90) % 360 });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl relative select-none">
      {/* Top action bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-white text-xs z-10">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-semibold font-mono text-slate-300">
            {isCustomSize 
              ? `Өз өлшемі: ${customSize.width} × ${customSize.height} ${customSize.unit}`
              : `Үлгі: ${selectedSize.name}`
            }
          </span>
        </div>
        
        {/* Guide Controls */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
          <button
            onClick={() => useEditorStore.getState().setGuideType('none')}
            className={`px-2 py-0.5 rounded-sm transition-all text-[10px] font-bold uppercase tracking-wider ${
              guideType === 'none' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Бағыттаусыз
          </button>
          <button
            onClick={() => useEditorStore.getState().setGuideType('passport')}
            className={`px-2 py-0.5 rounded-sm transition-all text-[10px] font-bold uppercase tracking-wider ${
              guideType === 'passport' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
            title="Стандартты биометриялық паспорт орналасуының туралау көрсеткіші"
          >
            Паспорттық бет
          </button>
          <button
            onClick={() => useEditorStore.getState().setGuideType('grid')}
            className={`px-2 py-0.5 rounded-sm transition-all text-[10px] font-bold uppercase tracking-wider ${
              guideType === 'grid' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
            title="Үштен бір ережесі бойынша тор сызықтары"
          >
            Тор
          </button>
          <button
            onClick={() => useEditorStore.getState().setGuideType('crosshair')}
            className={`px-2 py-0.5 rounded-sm transition-all text-[10px] font-bold uppercase tracking-wider ${
              guideType === 'crosshair' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
            title="Геометриялық орталық крест сызықтары"
          >
            Крест сызық
          </button>
        </div>
      </div>

      {/* Interactive canvas zone */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full bg-slate-900 relative overflow-hidden flex items-center justify-center"
        style={{ cursor: eyedropperActive ? 'cell' : brushMode ? 'crosshair' : 'grab' }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          style={{ touchAction: 'none' }}
          className="block max-w-full max-h-full shadow-2xl rounded-sm"
        />

        {/* Eyedropper state indicator */}
        {eyedropperActive && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full font-medium text-xs shadow-lg animate-bounce flex items-center space-x-2">
            <span className="w-2 h-2 bg-white rounded-full animate-ping" />
            <span>Өшіру үшін кез келген фон түсіне басыңыз!</span>
          </div>
        )}
      </div>

      {/* Onscreen utility control bar */}
      {imageEl && (
        <div className="bg-slate-950/90 border-t border-slate-800 p-2.5 flex items-center justify-center space-x-4 text-white z-10 backdrop-blur-md">
          <button
            onClick={() => adjustZoom(0.9)}
            className="p-1.5 hover:bg-slate-800 rounded transition-colors"
            title="Кішірейту"
          >
            <ZoomOut size={14} />
          </button>
          <span className="font-mono text-xs text-slate-400 min-w-[40px] text-center">
            {Math.round(transform.zoom * 100)}%
          </span>
          <button
            onClick={() => adjustZoom(1.1)}
            className="p-1.5 hover:bg-slate-800 rounded transition-colors"
            title="Үлкейту"
          >
            <ZoomIn size={14} />
          </button>

          <div className="w-px h-3 bg-slate-800" />

          <button
            onClick={rotate90}
            className="p-1.5 hover:bg-slate-800 rounded transition-colors flex items-center space-x-1"
            title="90°-қа бұру"
          >
            <RotateCw size={14} />
            <span className="text-[9px] font-mono font-bold uppercase">90°</span>
          </button>

          <button
            onClick={() => {
              pushHistory();
              setTransform({ flipH: !transform.flipH });
            }}
            className={`p-1.5 rounded transition-colors ${transform.flipH ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-slate-800'}`}
            title="Көлденеңінен аудару"
          >
            <RefreshCw size={14} className="rotate-90" />
          </button>

          <button
            onClick={() => {
              pushHistory();
              setTransform({ flipV: !transform.flipV });
            }}
            className={`p-1.5 rounded transition-colors ${transform.flipV ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-slate-800'}`}
            title="Тігінен аудару"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
