import { segmentForeground, type Config } from '@imgly/background-removal';

export type AiProgressCallback = (key: string, current: number, total: number) => void;

/**
 * Runs a real, fully in-browser AI segmentation model (IMG.LY's
 * @imgly/background-removal, an ISNet neural network executed via
 * ONNX Runtime Web / WebAssembly) on the given image and returns a mask
 * canvas matching the app's existing maskCanvas format: opaque white where
 * the subject should stay, transparent where the background should be
 * erased.
 *
 * No image data is ever sent to a server — inference happens entirely on
 * the user's device. The only network activity is a one-time download
 * (~40 MB, quantized model) of the neural network + WASM runtime on first
 * use; the browser caches it afterwards (Cache Storage API), so repeat runs
 * — even fully offline — are fast.
 */
export async function computeAiForegroundMask(
  imageSrc: string,
  naturalWidth: number,
  naturalHeight: number,
  onProgress?: AiProgressCallback,
): Promise<HTMLCanvasElement> {
  const config: Config = {
    model: 'isnet_quint8', // smallest quantized model: good quality/size tradeoff for passport-style photos
    device: 'gpu', // falls back to cpu/wasm automatically if WebGPU isn't available
    output: {
      format: 'image/png',
      quality: 1,
    },
    progress: onProgress,
  } as Config;

  const maskBlob = await segmentForeground(imageSrc, config);
  const maskUrl = URL.createObjectURL(maskBlob);

  try {
    const maskImg = await loadImage(maskUrl);

    // Render the grayscale confidence mask at the source image's native
    // resolution, then convert its luminance into our maskCanvas's alpha
    // channel (white RGB, variable alpha) so it composites identically to
    // manually brushed erase/restore strokes.
    const rasterCanvas = document.createElement('canvas');
    rasterCanvas.width = naturalWidth;
    rasterCanvas.height = naturalHeight;
    const rasterCtx = rasterCanvas.getContext('2d');
    if (!rasterCtx) throw new Error('Canvas 2D context unavailable');
    rasterCtx.drawImage(maskImg, 0, 0, naturalWidth, naturalHeight);

    const imageData = rasterCtx.getImageData(0, 0, naturalWidth, naturalHeight);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const luminance = data[i]; // mask is grayscale, R/G/B channels are equal
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = luminance;
    }
    rasterCtx.putImageData(imageData, 0, 0);

    return rasterCanvas;
  } finally {
    URL.revokeObjectURL(maskUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load AI mask image'));
    img.src = src;
  });
}
