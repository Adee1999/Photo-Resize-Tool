import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import heic2any from 'heic2any';
import { motion, AnimatePresence } from 'motion/react';
import { useEditorStore } from '../store/useEditorStore';
import { processImage } from '../utils/canvasFilters';
import { computeAiForegroundMask } from '../utils/aiBackgroundRemoval';
import PhotoEditorCanvas from '../components/PhotoEditorCanvas';
import { STANDARD_SIZES, PhotoSize } from '../types/editor';
import {
  Upload, Sparkles, Paintbrush, Sliders, Check, Trash2, Undo2, Redo2,
  FileImage, Crop, Eye, Info, HelpCircle, Download, RefreshCw, Palette, 
  Pipette, Layers, ShieldCheck, BrainCircuit
} from 'lucide-react';

export default function Home() {
  const {
    imageSrc,
    fileInfo,
    transform,
    filters,
    fitMode,
    backgroundColor,
    bgRemoval,
    selectedSize,
    customSize,
    isCustomSize,
    exportResolution,
    maskCanvas,
    bumpMaskVersion,
    setImage,
    setTransform,
    resetTransform,
    setFilters,
    setAutoEnhance,
    setBackground,
    setBgRemoval,
    setFitMode,
    setSize,
    setCustomSize,
    setIsCustomSize,
    setResolution,
    resetAll,
    undo,
    redo,
    history,
    historyIndex,
    pushHistory,
  } = useEditorStore();

  // HEIC loader state
  const [isConvertingHEIC, setIsConvertingHEIC] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);

  // Background removal auto-detected color
  const [detectedBgColor, setDetectedBgColor] = useState<[number, number, number] | null>(null);

  // Manual brush eraser state
  const [brushMode, setBrushMode] = useState(false);
  const [brushType, setBrushType] = useState<'erase' | 'restore'>('erase');
  const [brushSize, setBrushSize] = useState(40);
  const [eyedropperActive, setEyedropperActive] = useState(false);
  const [aiRemovalActive, setAiRemovalActive] = useState(false);
  const [aiRemovalProgress, setAiRemovalProgress] = useState(0);
  const [aiRemovalError, setAiRemovalError] = useState<string | null>(null);

  // Active section accordion inside left sidebar
  const [activeSection, setActiveSection] = useState<'size' | 'background' | 'filters' | 'resolution'>('size');

  // Export File Type Selection
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'pdf'>('jpeg');

  // Load custom units state
  const [customUnit, setCustomUnit] = useState<'cm' | 'mm' | 'in'>('cm');
  const [customWidthInput, setCustomWidthInput] = useState('5');
  const [customHeightInput, setCustomHeightInput] = useState('5');

  // Track initial custom size sync
  useEffect(() => {
    if (isCustomSize) {
      setCustomSize({
        width: parseFloat(customWidthInput) || 5,
        height: parseFloat(customHeightInput) || 5,
        unit: customUnit,
      });
    }
  }, [customWidthInput, customHeightInput, customUnit, isCustomSize, setCustomSize]);

  // Handle auto detect color callback from canvas
  const handleAutoDetectBg = useCallback((color: [number, number, number]) => {
    setDetectedBgColor(color);
  }, []);

  // Dropzone file handling
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    // Check 50MB size limit
    if (file.size > 50 * 1024 * 1024) {
      alert('Таңдалған файл 50 МБ шегінен асып кетті.');
      return;
    }

    setIsConvertingHEIC(true);
    setConversionError(null);

    try {
      let finalFile = file;

      // Handle Apple HEIC conversion completely offline
      if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.95,
        });
        const jpegBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        finalFile = new File([jpegBlob], file.name.replace(/\.heic$/i, '.jpg'), {
          type: 'image/jpeg',
        });
      }

      // Read image dimensions before storing
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          setImage(img.src, {
            name: finalFile.name,
            size: finalFile.size,
            type: finalFile.type,
          }, img.naturalWidth, img.naturalHeight);
          setIsConvertingHEIC(false);
        };
      };
      reader.readAsDataURL(finalFile);

    } catch (err: any) {
      console.error(err);
      setConversionError('HEIC суретін өңдеу мүмкін болмады. Файл форматын тексеріңіз немесе JPEG/PNG суретін қолданып көріңіз.');
      setIsConvertingHEIC(false);
    }
  }, [setImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/heic': ['.heic'],
    },
    multiple: false,
  } as any);

  // Toggle one-click background removal
  const handleToggleBgRemoval = () => {
    pushHistory();
    if (bgRemoval.enabled) {
      setBgRemoval({ enabled: false });
    } else {
      // Use auto detected border color if available, or fall back to standard white keying
      setBgRemoval({
        enabled: true,
        keyColor: detectedBgColor || [255, 255, 255],
        tolerance: 15,
        feather: 2,
      });
    }
  };

  // Trigger preset solid background color shifts
  const selectBackgroundColor = (colorHex: string) => {
    pushHistory();
    setBackground({ type: 'solid', color: colorHex });
  };

  // Run the real, fully local AI segmentation model (runs entirely in the
  // browser via WASM — no image data is ever sent anywhere) and write its
  // result into the manual mask canvas so it composites with the rest of
  // the pipeline (and can still be brush-touched-up afterwards).
  const handleAiBackgroundRemoval = async () => {
    if (!imageSrc || !maskCanvas) return;

    pushHistory();
    setAiRemovalError(null);
    setAiRemovalActive(true);
    setAiRemovalProgress(0);

    try {
      const aiMask = await computeAiForegroundMask(
        imageSrc,
        maskCanvas.width,
        maskCanvas.height,
        (_key, current, total) => {
          if (total > 0) {
            setAiRemovalProgress(Math.round((current / total) * 100));
          }
        }
      );

      const mCtx = maskCanvas.getContext('2d');
      if (mCtx) {
        mCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        mCtx.drawImage(aiMask, 0, 0);
        bumpMaskVersion();
      }
    } catch (err) {
      console.error('AI background removal failed:', err);
      setAiRemovalError(
        'ЖИ моделін жүктеу немесе іске қосу мүмкін болмады. Интернет байланысын тексеріңіз (модель бірінші рет жүктелуі керек) немесе браузеріңіз WebAssembly-ді қолдайтынын тексеріңіз.'
      );
    } finally {
      setAiRemovalActive(false);
    }
  };

  // Apply Auto-Enhance preset filter mappings
  const [autoEnhanceActive, setAutoEnhanceActive] = useState(false);
  const handleAutoEnhanceToggle = () => {
    const newState = !autoEnhanceActive;
    setAutoEnhanceActive(newState);
    setAutoEnhance(newState);
  };

  // Convert size to inches and calculate exact output pixel density
  const calculateOutputResolution = () => {
    const phys = isCustomSize ? customSize : selectedSize;
    let wIn = phys.width;
    let hIn = phys.height;

    if (phys.unit === 'cm') {
      wIn = phys.width / 2.54;
      hIn = phys.height / 2.54;
    } else if (phys.unit === 'mm') {
      wIn = phys.width / 25.4;
      hIn = phys.height / 25.4;
    }

    const widthPx = Math.round(wIn * exportResolution);
    const heightPx = Math.round(hIn * exportResolution);

    return { widthPx, heightPx };
  };

  const { widthPx, heightPx } = calculateOutputResolution();

  // Estimate final exported file size in KB/MB based on pixel density & compression ratios
  const estimateFileSize = () => {
    const totalPixels = widthPx * heightPx;
    let estBytes = 0;

    if (exportFormat === 'png') {
      estBytes = totalPixels * 0.45; // Lossless PNG compression rough estimate
    } else if (exportFormat === 'jpeg') {
      estBytes = totalPixels * 0.15; // Standard high-quality JPEG estimate
    } else {
      estBytes = totalPixels * 0.15 + 15000; // PDF overhead + JPEG stream
    }

    const kb = estBytes / 1024;
    if (kb < 100) return 'Under 100 KB';
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  // Execute full-resolution print-ready download
  const handleExportDownload = async () => {
    if (!imageSrc) return;

    // Dynamically retrieve jsPDF
    const { jsPDF } = await import('jspdf');

    // 1. Setup exact high-resolution offscreen canvas
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = widthPx;
    exportCanvas.height = heightPx;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // 2. Draw background fill
    // JPEG and PDF cannot represent transparency: any alpha gets flattened to
    // black by toDataURL(), which made background-removed exports come out
    // with an unwanted black backdrop instead of transparency. Only leave the
    // canvas transparent when the chosen format can actually keep it (PNG).
    const canPreserveTransparency = exportFormat === 'png';
    if (backgroundColor.type === 'solid') {
      ctx.fillStyle = backgroundColor.color;
      ctx.fillRect(0, 0, widthPx, heightPx);
    } else if (canPreserveTransparency) {
      // transparent png export
      ctx.clearRect(0, 0, widthPx, heightPx);
    } else {
      // Fall back to a clean white backdrop for JPEG/PDF so removed
      // backgrounds don't silently turn black.
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, widthPx, heightPx);
    }

    // 3. Render transformed image
    // To match coordinates, we find the workspace crop metrics
    // We recreate the exact matrix translation scaled up!
    const phys = isCustomSize ? customSize : selectedSize;
    const ar = phys.width / phys.height;

    // Recreate workspace viewport box scale
    // In canvas workspace we centered it using standard width limit 600px
    const W = 600;
    const H = 450;
    let workspaceCropWidth = W * 0.8;
    let workspaceCropHeight = workspaceCropWidth / ar;
    if (workspaceCropHeight > H * 0.8) {
      workspaceCropHeight = H * 0.8;
      workspaceCropWidth = workspaceCropHeight * ar;
    }

    // High resolution conversion multiplier
    const scaleRatio = widthPx / workspaceCropWidth;

    const centerX = widthPx / 2;
    const centerY = heightPx / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.translate(transform.x * scaleRatio, transform.y * scaleRatio);
    ctx.rotate((transform.rotation * Math.PI) / 180);

    // Image original details
    const imageEl = new Image();
    imageEl.src = imageSrc;
    await new Promise((resolve) => {
      imageEl.onload = resolve;
    });

    const baseScaleX = workspaceCropWidth / imageEl.naturalWidth;
    const baseScaleY = workspaceCropHeight / imageEl.naturalHeight;
    const baseScale = fitMode === 'fit' ? Math.min(baseScaleX, baseScaleY) : Math.max(baseScaleX, baseScaleY);

    const flipX = transform.flipH ? -1 : 1;
    const flipY = transform.flipV ? -1 : 1;

    ctx.scale(baseScale * transform.zoom * scaleRatio * flipX, baseScale * transform.zoom * scaleRatio * flipY);

    // Load mask canvas data
    let nativeMaskCanvas = null;
    if (maskCanvas) {
      nativeMaskCanvas = maskCanvas;
    }

    // Run the high quality filter processor on the full resolution canvas!
    // We draw the processed canvas inside our transform
    const highResProcessed = processImage(
      imageEl,
      filters,
      bgRemoval.enabled,
      bgRemoval.keyColor,
      bgRemoval.tolerance,
      bgRemoval.feather,
      nativeMaskCanvas
    );

    ctx.drawImage(highResProcessed, -imageEl.naturalWidth / 2, -imageEl.naturalHeight / 2);
    ctx.restore();

    // 4. Download file conforming strictly to the selected export format
    const outputFileName = fileInfo 
      ? `converted_${fileInfo.name.split('.')[0]}` 
      : 'photo_converter';

    if (exportFormat === 'png') {
      const link = document.createElement('a');
      link.download = `${outputFileName}.png`;
      link.href = exportCanvas.toDataURL('image/png', 1.0);
      link.click();
    } else if (exportFormat === 'jpeg') {
      const link = document.createElement('a');
      link.download = `${outputFileName}.jpg`;
      link.href = exportCanvas.toDataURL('image/jpeg', 0.98);
      link.click();
    } else {
      // PDF export with page size matching exact print crop dimensions
      let mmW = phys.width;
      let mmH = phys.height;

      if (phys.unit === 'cm') {
        mmW = phys.width * 10;
        mmH = phys.height * 10;
      } else if (phys.unit === 'in') {
        mmW = phys.width * 25.4;
        mmH = phys.height * 25.4;
      }

      const doc = new jsPDF({
        orientation: mmW > mmH ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [mmW, mmH],
      });

      const jpegUrl = exportCanvas.toDataURL('image/jpeg', 0.98);
      doc.addImage(jpegUrl, 'JPEG', 0, 0, mmW, mmH);
      doc.save(`${outputFileName}.pdf`);
    }
  };

  return (
    <div className="bg-[#F8F9FA] dark:bg-slate-900 min-h-screen transition-colors text-slate-800 dark:text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!imageSrc ? (
          /* Landing/Upload Stage */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto mt-12 text-center"
          >
            <div className="space-y-4 mb-8">
              <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-3 py-1 rounded text-[10px] font-bold tracking-wider uppercase">
                100% Қауіпсіз • Жергілікті браузер құралы
              </span>
              <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
                Фотосуреттерді нақты физикалық өлшемдерге түрлендіріңіз
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                Фотосуреттерді дәл сантиметр, миллиметр немесе дюйм өлшемдеріне келтіріп кесіңіз. Фон түстерін өшіріп, сүзгілер қолданыңыз және басып шығаруға дайын PDF, PNG немесе JPEG форматында сақтаңыз.
              </p>
            </div>

            {/* Dropzone Container */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-10 transition-colors cursor-pointer flex flex-col items-center justify-center space-y-5 bg-white dark:bg-slate-950 ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-blue-500/60 shadow-sm'
              }`}
            >
              <input {...getInputProps()} />
              
              {isConvertingHEIC ? (
                <div className="flex flex-col items-center space-y-4 py-4">
                  <RefreshCw className="animate-spin text-blue-600 dark:text-blue-500" size={36} />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    Apple HEIC суретін өңдеу...
                  </p>
                  <p className="text-xs text-slate-400">
                    Түрлендіру толығымен браузеріңізде, жергілікті түрде орындалады
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm">
                    <Upload size={20} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Фотосуретті осы жерге сүйреп апарыңыз
                    </p>
                    <p className="text-xs text-slate-400">
                      JPG, JPEG, PNG, WEBP және HEIC форматтарын қолдайды (Макс. 50 МБ)
                    </p>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold px-5 py-2 rounded text-xs uppercase tracking-wider transition-all shadow-sm">
                    Файлды таңдау
                  </button>
                </>
              )}
            </div>

            {conversionError && (
              <p className="text-red-500 text-xs mt-4 font-bold uppercase tracking-wide">{conversionError}</p>
            )}

            {/* Micro Privacy Badge */}
            <div className="mt-8 flex items-center justify-center space-x-2 text-slate-400 text-[11px] font-medium uppercase tracking-wider">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Оффлайн өңдеу белсенді • Жергілікті және жеке</span>
            </div>
          </motion.div>
        ) : (
          /* Editor Main Workspace (3-Column Layout on Desktop) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Sidebar: Controls Column */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-950 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 flex flex-col max-h-[85vh] overflow-y-auto">
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3.5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                  <Sliders size={16} className="text-blue-600 dark:text-blue-400" />
                  <span>Редактор басқару элементтері</span>
                </h2>
                <button
                  onClick={resetAll}
                  className="text-[10px] text-red-500 hover:text-red-600 font-bold uppercase tracking-wider flex items-center space-x-1 hover:bg-red-50 dark:hover:bg-red-950/20 px-2 py-1 rounded transition-colors"
                >
                  <Trash2 size={11} />
                  <span>Барлығын қалпына келтіру</span>
                </button>
              </div>

              {/* Collapsible Accordion sections */}
              <div className="space-y-4">
                
                {/* Accordion Block: Standard & Custom Sizing */}
                <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                  <button
                    onClick={() => setActiveSection(activeSection === 'size' ? 'size' : 'size')}
                    className="w-full px-4 py-2.5 flex items-center justify-between bg-slate-50 dark:bg-slate-900 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800"
                  >
                    <span className="flex items-center space-x-2">
                      <Crop size={14} className="text-slate-500" />
                      <span>1. Кесу және физикалық өлшем</span>
                    </span>
                  </button>

                  <div className="p-4 space-y-4 bg-white dark:bg-slate-950">
                    {/* Positioning Modes */}
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-900 rounded p-0.5">
                      <button
                        onClick={() => setFitMode('fill')}
                        className={`py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${
                          fitMode === 'fill' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                        }`}
                        title="Өлшемдерді толық толтырып, шеттерін автоматты кесу"
                      >
                        ТОЛТЫРУ (шеттерін кесу)
                      </button>
                      <button
                        onClick={() => setFitMode('fit')}
                        className={`py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${
                          fitMode === 'fit' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                        }`}
                        title="Барлық суретті өлшем ішіне сыйдыру"
                      >
                        СЫЮ (жиектермен)
                      </button>
                    </div>

                    {/* Custom Toggle */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                        Өз өлшемі
                      </label>
                      <input
                        type="checkbox"
                        checked={isCustomSize}
                        onChange={(e) => setIsCustomSize(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>

                    {!isCustomSize ? (
                      /* Preset Grid */
                      <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {STANDARD_SIZES.map((size) => (
                          <button
                            key={size.id}
                            onClick={() => setSize(size)}
                            className={`px-2.5 py-1.5 border rounded text-[11px] font-semibold text-left transition-all truncate ${
                              selectedSize.id === size.id
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="block truncate">{size.name}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      /* Custom Sizing inputs */
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Ені</label>
                            <input
                              type="number"
                              step="0.1"
                              value={customWidthInput}
                              onChange={(e) => setCustomWidthInput(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Биіктігі</label>
                            <input
                              type="number"
                              step="0.1"
                              value={customHeightInput}
                              onChange={(e) => setCustomHeightInput(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Бірлік</label>
                            <select
                              value={customUnit}
                              onChange={(e) => setCustomUnit(e.target.value as any)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="cm">cm</option>
                              <option value="mm">mm</option>
                              <option value="in">in</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Accordion Block: Background Removal & Colorizer */}
                <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                  <button
                    onClick={() => setActiveSection(activeSection === 'background' ? 'background' : 'background')}
                    className="w-full px-4 py-2.5 flex items-center justify-between bg-slate-50 dark:bg-slate-900 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800"
                  >
                    <span className="flex items-center space-x-2">
                      <Paintbrush size={14} className="text-slate-500" />
                      <span>2. Фонды өшіру және түс</span>
                    </span>
                  </button>

                  <div className="p-4 space-y-4 bg-white dark:bg-slate-950">
                    {/* AI (fully local, in-browser neural network) removal button */}
                    <button
                      onClick={handleAiBackgroundRemoval}
                      disabled={aiRemovalActive}
                      className="w-full py-2 px-4 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 border shadow-sm border-purple-300 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/50 disabled:opacity-60"
                    >
                      <BrainCircuit size={13} className={aiRemovalActive ? 'animate-pulse' : ''} />
                      <span>
                        {aiRemovalActive
                          ? `ЖИ өңдеп жатыр... ${aiRemovalProgress}%`
                          : 'ЖИ арқылы фонды өшіру'}
                      </span>
                    </button>
                    {aiRemovalActive && (
                      <div className="w-full h-1 bg-purple-100 dark:bg-purple-950/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all duration-300"
                          style={{ width: `${aiRemovalProgress}%` }}
                        />
                      </div>
                    )}
                    {aiRemovalError && (
                      <p className="text-[10px] text-red-500 leading-relaxed">{aiRemovalError}</p>
                    )}
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Толығымен браузерде жұмыс істейтін нейрондық желі. Күрделі немесе біркелкі емес фондарда дәлірек нәтиже береді. Бірінші рет қосқанда модель файлы (~40 МБ) жүктеледі, содан кейін браузер оны кэштейді.
                    </p>

                    <div className="border-t border-slate-100 dark:border-slate-900 pt-3" />

                    {/* Auto removal button */}
                    <button
                      onClick={handleToggleBgRemoval}
                      className={`w-full py-2 px-4 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 border shadow-sm ${
                        bgRemoval.enabled
                          ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:bg-slate-50 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <Sparkles size={13} className="text-yellow-500 animate-pulse" />
                      <span>{bgRemoval.enabled ? 'Түс бойынша өшіру белсенді' : 'Жылдам автофон өшіру (түс бойынша)'}</span>
                    </button>

                    {bgRemoval.enabled && (
                      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-900">
                        {/* Tolerance & Feather */}
                        <div>
                          <div className="flex justify-between text-[11px] mb-1 font-bold uppercase tracking-wide text-slate-500">
                            <span>Төзімділік (сезімталдық)</span>
                            <span className="font-mono">{bgRemoval.tolerance}%</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="60"
                            value={bgRemoval.tolerance}
                            onChange={(e) => {
                              pushHistory();
                              setBgRemoval({ tolerance: parseInt(e.target.value) });
                            }}
                            className="w-full accent-blue-600"
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-[11px] mb-1 font-bold uppercase tracking-wide text-slate-500">
                            <span>Жиек жұмсарту</span>
                            <span className="font-mono">{bgRemoval.feather}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            value={bgRemoval.feather}
                            onChange={(e) => {
                              pushHistory();
                              setBgRemoval({ feather: parseInt(e.target.value) });
                            }}
                            className="w-full accent-blue-600"
                          />
                        </div>

                        {/* Eyedropper button */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Өшіру үшін фон түсін таңдаңыз</span>
                          <button
                            onClick={() => setEyedropperActive(!eyedropperActive)}
                            className={`p-1.5 border rounded flex items-center justify-center transition-colors ${eyedropperActive ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500 hover:text-slate-900'}`}
                            title="Түс тамшысын іске қосу"
                          >
                            <Pipette size={13} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Manual Erase brush controls */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-900 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Дәл қылмен өшіргіш</span>
                        <input
                          type="checkbox"
                          checked={brushMode}
                          onChange={(e) => setBrushMode(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>

                      {brushMode && (
                        <div className="space-y-3 bg-slate-50 dark:bg-slate-900 p-3 rounded">
                          <div className="flex justify-between text-[11px] font-bold uppercase tracking-wide">
                            <span className="text-slate-500">Қыл түрі</span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => setBrushType('erase')}
                                className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${brushType === 'erase' ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                              >
                                Өшіру
                              </button>
                              <button
                                onClick={() => setBrushType('restore')}
                                className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${brushType === 'restore' ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                              >
                                Қалпына келтіру
                              </button>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] mb-1 font-bold uppercase tracking-wide text-slate-500">
                              <span>Қыл радиусы</span>
                              <span className="font-mono">{brushSize}px</span>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="120"
                              value={brushSize}
                              onChange={(e) => setBrushSize(parseInt(e.target.value))}
                              className="w-full accent-blue-600"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Background color select presets */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-900 space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                        Жаңа фон түсін таңдаңыз
                      </label>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                        {/* Presets - Sleek Square Presets with rounded-sm */}
                        {[
                          { name: 'Ақ', hex: '#FFFFFF' },
                          { name: 'Көк', hex: '#0047AB' },
                          { name: 'Сұр', hex: '#808080' },
                          { name: 'Қызыл', hex: '#FF0000' },
                          { name: 'Жасыл', hex: '#008000' },
                        ].map((c) => (
                          <button
                            key={c.hex}
                            onClick={() => selectBackgroundColor(c.hex)}
                            className={`w-7 h-7 rounded-sm border border-slate-200 shadow-sm relative transition-all hover:scale-105 flex items-center justify-center`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          >
                            {backgroundColor.type === 'solid' && backgroundColor.color === c.hex && (
                              <Check size={12} className={c.hex === '#FFFFFF' ? 'text-black font-bold' : 'text-white font-bold'} />
                            )}
                          </button>
                        ))}

                        {/* Transparent option */}
                        <button
                          onClick={() => {
                            pushHistory();
                            setBackground({ type: 'transparent' });
                          }}
                          className="w-7 h-7 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden flex items-center justify-center bg-slate-200 transition-all hover:scale-105"
                          title="Мөлдір"
                        >
                          <div className="absolute inset-0 bg-transparent flex flex-wrap">
                            <div className="w-1/2 h-1/2 bg-white" />
                            <div className="w-1/2 h-1/2 bg-slate-300" />
                            <div className="w-1/2 h-1/2 bg-slate-300" />
                            <div className="w-1/2 h-1/2 bg-white" />
                          </div>
                          {backgroundColor.type === 'transparent' && (
                            <Check size={12} className="text-black z-10 font-bold" />
                          )}
                        </button>

                        {/* Custom Picker */}
                        <div className="relative w-7 h-7 rounded-sm border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center group cursor-pointer transition-all hover:scale-105">
                          <input
                            type="color"
                            value={backgroundColor.color}
                            onChange={(e) => {
                              setBackground({ type: 'solid', color: e.target.value });
                            }}
                            onBlur={() => pushHistory()}
                            className="absolute inset-0 w-[150%] h-[150%] translate-x-[-15%] translate-y-[-15%] cursor-pointer"
                          />
                          <Palette size={12} className="text-slate-600 mix-blend-difference pointer-events-none" />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Accordion Block: Photo Filters & Lighting */}
                <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                  <button
                    onClick={() => setActiveSection(activeSection === 'filters' ? 'filters' : 'filters')}
                    className="w-full px-4 py-2.5 flex items-center justify-between bg-slate-50 dark:bg-slate-900 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800"
                  >
                    <span className="flex items-center space-x-2">
                      <Sliders size={14} className="text-slate-500" />
                      <span>3. Сүзгілер мен жарықты реттеу</span>
                    </span>
                  </button>

                  <div className="p-4 space-y-4 bg-white dark:bg-slate-950 max-h-[300px] overflow-y-auto">
                    {/* Auto-Enhance preset */}
                    <div className="flex items-center justify-between p-2 bg-blue-50/50 dark:bg-slate-900/60 rounded border border-blue-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center space-x-1">
                        <Sparkles size={11} />
                        <span>AI автожақсарту режимі</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={autoEnhanceActive}
                        onChange={handleAutoEnhanceToggle}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                    </div>

                    {/* Reset Filters button */}
                    <button
                      onClick={() => {
                        setAutoEnhanceActive(false);
                        useEditorStore.getState().resetFilters();
                      }}
                      className="w-full py-1.5 text-xs font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-300 rounded"
                    >
                      Сүзгі жүгірткілерін қалпына келтіру
                    </button>

                    {/* Sliders loop */}
                    {[
                      { key: 'exposure', label: 'Экспозиция', min: -80, max: 80, unit: '%' },
                      { key: 'brightness', label: 'Жарықтық', min: -80, max: 80, unit: '%' },
                      { key: 'contrast', label: 'Контраст', min: -80, max: 80, unit: '%' },
                      { key: 'saturation', label: 'Қанықтық', min: -100, max: 100, unit: '%' },
                      { key: 'sharpness', label: 'Айқындық', min: 0, max: 100, unit: '%' },
                      { key: 'temperature', label: 'Температура (жылылық)', min: -100, max: 100, unit: '%' },
                      { key: 'highlights', label: 'Жарық реңктер', min: -80, max: 80, unit: '%' },
                      { key: 'shadows', label: 'Көлеңкелер', min: -80, max: 80, unit: '%' },
                    ].map((slider) => (
                      <div key={slider.key}>
                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                          <span>{slider.label}</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200">
                            {filters[slider.key as keyof typeof filters] as number > 0 ? '+' : ''}
                            {filters[slider.key as keyof typeof filters] as number}
                            {slider.unit}
                          </span>
                        </div>
                        <input
                           type="range"
                           min={slider.min}
                           max={slider.max}
                           value={filters[slider.key as keyof typeof filters] as number}
                           onChange={(e) => {
                             setFilters({ [slider.key]: parseInt(e.target.value) });
                           }}
                           onMouseUp={() => pushHistory()}
                           className="w-full accent-blue-600"
                        />
                      </div>
                    ))}

                    {/* Checkboxes: Grayscale, Sepia, BlackWhite */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-900 space-y-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Монохромды алдын ала орнатулар
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'grayscale', label: 'Сұр реңк' },
                          { key: 'sepia', label: 'Сепия' },
                          { key: 'blackWhite', label: 'Ақ-қара' },
                        ].map((chk) => (
                          <button
                            key={chk.key}
                            onClick={() => {
                              pushHistory();
                              const activeVal = !filters[chk.key as keyof typeof filters];
                              setFilters({
                                grayscale: false,
                                sepia: false,
                                blackWhite: false,
                                [chk.key]: activeVal,
                              });
                            }}
                            className={`py-1.5 px-2 border rounded text-[10px] font-bold uppercase tracking-wide text-center transition-all ${
                              filters[chk.key as keyof typeof filters]
                                ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-bold'
                                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            {chk.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accordion Block: Export Resolution */}
                <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                  <button
                    onClick={() => setActiveSection(activeSection === 'resolution' ? 'resolution' : 'resolution')}
                    className="w-full px-4 py-2.5 flex items-center justify-between bg-slate-50 dark:bg-slate-900 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800"
                  >
                    <span className="flex items-center space-x-2">
                      <Layers size={14} className="text-slate-500" />
                      <span>4. Шығыс ажыратымдылығы (PPI)</span>
                    </span>
                  </button>

                  <div className="p-4 bg-white dark:bg-slate-950">
                    <div className="grid grid-cols-3 gap-1.5">
                      {[300, 600, 900].map((ppi) => (
                        <button
                          key={ppi}
                          onClick={() => setResolution(ppi as 300 | 600 | 900)}
                          className={`py-2 px-1 border rounded text-center transition-all ${
                            exportResolution === ppi
                              ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <span className="block font-bold text-xs">{ppi}</span>
                          <span className="text-[9px] font-bold uppercase opacity-70">PPI</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2.5 leading-relaxed">
                      * Қарапайым қағазға басып шығару үшін <strong>300 PPI</strong> таңдаңыз. Жоғары анықтықтағы жылтыр фотонәтиже үшін <strong>600 PPI</strong> немесе <strong>900 PPI</strong> таңдаңыз.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Center: Live Editor Canvas */}
            <div className="lg:col-span-5 h-[80vh] flex flex-col justify-between">
              <div className="flex-1 w-full relative">
                <PhotoEditorCanvas
                  brushMode={brushMode}
                  brushType={brushType}
                  brushSize={brushSize}
                  eyedropperActive={eyedropperActive}
                  setEyedropperActive={setEyedropperActive}
                  onAutoDetectBg={handleAutoDetectBg}
                />
              </div>

              {/* History Toolbar (Undo, Redo, Reset Canvas) */}
              <div className="mt-4 flex items-center justify-between bg-white dark:bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
                <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <button
                    disabled={historyIndex <= 0}
                    onClick={undo}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex items-center space-x-1"
                    title="Болдырмау"
                  >
                    <Undo2 size={13} />
                    <span>Болдырмау</span>
                  </button>
                  <button
                    disabled={historyIndex >= history.length - 1}
                    onClick={redo}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex items-center space-x-1"
                    title="Қайталау"
                  >
                    <Redo2 size={13} />
                    <span>Қайталау</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    pushHistory();
                    resetTransform();
                  }}
                  className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-bold uppercase tracking-wider text-[10px] flex items-center space-x-1 hover:bg-slate-100 dark:hover:bg-slate-900 px-2 py-1 rounded transition-colors"
                >
                  <RefreshCw size={11} />
                  <span>Жылжыту/масштабты қалпына келтіру</span>
                </button>
              </div>
            </div>

            {/* Right Sidebar: Photo Info & Export Column */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-950 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <FileImage size={15} className="text-blue-600 dark:text-blue-400" />
                <span>Экспорт тақтасы</span>
              </h2>

              {/* Photo statistics analysis */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded border border-slate-200 dark:border-slate-800 space-y-3.5 text-xs">
                <div>
                  <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Бастапқы файл</span>
                  <span className="block text-slate-800 dark:text-slate-200 font-semibold truncate" title={fileInfo?.name}>
                    {fileInfo?.name}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    {fileInfo?.size ? `${(fileInfo.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                  </span>
                </div>

                <div>
                  <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Физикалық шығыс өлшемі</span>
                  <span className="block text-blue-600 dark:text-blue-400 font-extrabold text-sm uppercase tracking-wide">
                    {isCustomSize
                      ? `${customSize.width} × ${customSize.height} ${customSize.unit}`
                      : selectedSize.name
                    }
                  </span>
                </div>

                <div>
                  <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Есептелген пиксель тығыздығы</span>
                  <span className="block font-mono text-slate-800 dark:text-slate-200 font-bold">
                    {widthPx} × {heightPx} pixels
                  </span>
                </div>

                <div>
                  <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Басып шығару ажыратымдылығы</span>
                  <span className="block text-slate-800 dark:text-slate-200 font-semibold">
                    {exportResolution} PPI (дюймдегі пиксель саны)
                  </span>
                </div>

                <div>
                  <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Болжалды файл өлшемі</span>
                  <span className="block font-mono text-slate-800 dark:text-slate-200 font-semibold">
                    {estimateFileSize()}
                  </span>
                </div>
              </div>

              {/* Format selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Шығыс файл форматын таңдаңыз
                </label>
                <div className="grid grid-cols-3 gap-0.5 bg-slate-100 dark:bg-slate-900 p-0.5 rounded">
                  {['png', 'jpeg', 'pdf'].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt as any)}
                      className={`py-1 text-[11px] font-bold uppercase rounded-sm transition-all ${
                        exportFormat === fmt
                          ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Massive CTA Download button */}
              <button
                onClick={handleExportDownload}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-sm flex items-center justify-center space-x-2 mt-4"
              >
                <Download size={14} />
                <span>Басып шығаруға арналған файлды жүктеу</span>
              </button>

              {/* Upload different photo */}
              <button
                onClick={() => setImage(null, null)}
                className="w-full py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-400 rounded text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Басқа суретті жүктеу
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
