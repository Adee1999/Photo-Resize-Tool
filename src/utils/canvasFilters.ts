import { FilterState } from '../types/editor';

/**
 * Calculates Euclidean color distance between two RGB colors
 */
export function getColorDistance(c1: [number, number, number], c2: [number, number, number]): number {
  return Math.sqrt((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2);
}

/**
 * Auto-detects the background color of an image by sampling its border pixels
 */
export function autoDetectBackgroundColor(canvas: HTMLCanvasElement): [number, number, number] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [255, 255, 255];

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Sample borders
  const samples: Array<[number, number, number]> = [];
  const step = Math.max(1, Math.floor(width / 20)); // sample 20 points along each edge

  // Top and bottom edges
  for (let x = 0; x < width; x += step) {
    const topIdx = x * 4;
    const bottomIdx = ((height - 1) * width + x) * 4;
    samples.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
    samples.push([data[bottomIdx], data[bottomIdx + 1], data[bottomIdx + 2]]);
  }

  // Left and right edges
  for (let y = 0; y < height; y += step) {
    const leftIdx = y * width * 4;
    const rightIdx = (y * width + (width - 1)) * 4;
    samples.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);
    samples.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
  }

  // Find average
  let sumR = 0, sumG = 0, sumB = 0;
  for (const [r, g, b] of samples) {
    sumR += r;
    sumG += g;
    sumB += b;
  }

  const count = samples.length || 1;
  return [
    Math.round(sumR / count),
    Math.round(sumG / count),
    Math.round(sumB / count)
  ];
}

/**
 * Applies single-pass color/exposure adjustments, chroma-key background removal, and brush masking.
 */
export function processImage(
  sourceCanvas: HTMLCanvasElement | HTMLImageElement,
  filters: FilterState,
  bgRemovalEnabled: boolean,
  keyColor: [number, number, number] | null,
  tolerance: number,
  feather: number,
  maskCanvas: HTMLCanvasElement | null
): HTMLCanvasElement {
  const outputCanvas = document.createElement('canvas');
  const width = sourceCanvas instanceof HTMLImageElement ? sourceCanvas.naturalWidth : sourceCanvas.width;
  const height = sourceCanvas instanceof HTMLImageElement ? sourceCanvas.naturalHeight : sourceCanvas.height;
  
  outputCanvas.width = width;
  outputCanvas.height = height;

  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return outputCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  const imageData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
  const data = imageData.data;

  // Filter parameters
  const exposureFactor = Math.pow(2, filters.exposure / 100);
  const contrastFactor = (259 * (filters.contrast + 255)) / (255 * (259 - filters.contrast));
  const brightnessOffset = (filters.brightness / 100) * 255;
  const saturationFactor = (filters.saturation + 100) / 100;
  
  // Highlights / Shadows
  const hlFactor = filters.highlights / 100; // -1 to 1
  const shFactor = filters.shadows / 100;    // -1 to 1

  // Temperature (Warmth: shift red/yellow; Coolness: shift blue)
  const tempShift = filters.temperature; // -100 to 100

  // Background removal parameters
  const [kr, kg, kb] = keyColor || [255, 255, 255];
  const maxDist = 441.67; // Math.sqrt(255^2 * 3)
  const tDist = (tolerance / 100) * maxDist;
  const fDist = (feather / 100) * maxDist;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    let a = data[i + 3];

    if (a === 0) continue;

    // --- 1. Background Removal (Chroma Key) ---
    if (bgRemovalEnabled && keyColor) {
      const dist = Math.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2);
      if (dist < tDist) {
        a = 0;
      } else if (dist < tDist + fDist && fDist > 0) {
        const ratio = (dist - tDist) / fDist;
        a = Math.min(a, Math.floor(ratio * 255));
      }
    }

    if (a > 0) {
      // --- 2. Exposure & Brightness ---
      r = r * exposureFactor + brightnessOffset;
      g = g * exposureFactor + brightnessOffset;
      b = b * exposureFactor + brightnessOffset;

      // --- 3. Highlights & Shadows ---
      // Simple luminance estimation (rec709)
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const normLum = lum / 255;

      if (normLum > 0.5) {
        // Highlight adjustment (affects brighter pixels)
        const hlMultiplier = 1 + hlFactor * Math.pow((normLum - 0.5) * 2, 2);
        r *= hlMultiplier;
        g *= hlMultiplier;
        b *= hlMultiplier;
      } else {
        // Shadow adjustment (affects darker pixels)
        const shMultiplier = 1 + shFactor * Math.pow((0.5 - normLum) * 2, 2);
        r *= shMultiplier;
        g *= shMultiplier;
        b *= shMultiplier;
      }

      // --- 4. Contrast ---
      r = (r - 128) * contrastFactor + 128;
      g = (g - 128) * contrastFactor + 128;
      b = (b - 128) * contrastFactor + 128;

      // --- 5. Temperature ---
      if (tempShift > 0) {
        // Warm: Increase red and yellow (red + green)
        r += tempShift * 0.4;
        g += tempShift * 0.15;
        b -= tempShift * 0.25;
      } else if (tempShift < 0) {
        // Cool: Increase blue, decrease red/green
        r += tempShift * 0.2; // tempShift is negative
        g -= tempShift * 0.05;
        b -= tempShift * 0.4;
      }

      // --- 6. Saturation & Grayscale / Sepia / Black & White ---
      const l = 0.299 * r + 0.587 * g + 0.114 * b; // standard grayscale conversion

      if (filters.blackWhite) {
        // Hard threshold or clean b&w
        const bw = l > 128 ? 255 : 0;
        r = bw;
        g = bw;
        b = bw;
      } else if (filters.grayscale) {
        r = l;
        g = l;
        b = l;
      } else if (filters.sepia) {
        const sr = l * 0.90 + 30;
        const sg = l * 0.75 + 15;
        const sb = l * 0.55;
        r = sr;
        g = sg;
        b = sb;
      } else if (saturationFactor !== 1) {
        r = l + (r - l) * saturationFactor;
        g = l + (g - l) * saturationFactor;
        b = l + (b - l) * saturationFactor;
      }

      // Bound channels to [0, 255]
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
    
    data[i + 3] = a;
  }

  ctx.putImageData(imageData, 0, 0);

  // --- 7. Apply Manual Brush Mask if enabled ---
  if (maskCanvas) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(maskCanvas, 0, 0, outputCanvas.width, outputCanvas.height);
    ctx.restore();
  }

  // --- 8. Apply Sharpness Convolution if specified ---
  if (filters.sharpness > 0) {
    applySharpenInPlace(ctx, outputCanvas.width, outputCanvas.height, filters.sharpness);
  }

  return outputCanvas;
}

/**
 * Sharpens a canvas's image data using a 3x3 convolution kernel in-place
 */
function applySharpenInPlace(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const originalData = new Uint8ClampedArray(data);

  // Weight scale: amount 0 to 100 maps to sharpening weight
  const weight = (amount / 100) * 0.8; // cap it to prevent hyper-noise
  const kCenter = 1 + 4 * weight;
  const kEdge = -weight;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Skip transparent pixels
      if (originalData[idx + 3] === 0) continue;

      for (let c = 0; c < 3; c++) {
        const val =
          originalData[idx + c] * kCenter +
          (originalData[idx - 4 + c] +
            originalData[idx + 4 + c] +
            originalData[idx - width * 4 + c] +
            originalData[idx + width * 4 + c]) *
            kEdge;
        data[idx + c] = Math.max(0, Math.min(255, val));
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}
