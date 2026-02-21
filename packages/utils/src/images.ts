/**
 * Image Compression Utilities
 *
 * Client-side image compression for data-light usage.
 * Target: WebP format, ≤200KB per image.
 */

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const TARGET_SIZE_KB = 200;
const INITIAL_QUALITY = 0.8;
const MIN_QUALITY = 0.3;

/**
 * Compress an image file to WebP format under the target size.
 * @param file - Original image file
 * @param maxSizeKB - Maximum file size in KB (default: 200KB)
 * @returns Compressed image as a Blob
 */
export async function compressImage(
    file: File,
    maxSizeKB: number = TARGET_SIZE_KB
): Promise<Blob> {
    const bitmap = await createImageBitmap(file);

    // Calculate dimensions maintaining aspect ratio
    let { width, height } = bitmap;
    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }

    // Draw to canvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    // Compress iteratively until under target size
    let quality = INITIAL_QUALITY;
    let blob = await canvas.convertToBlob({ type: "image/webp", quality });

    while (blob.size > maxSizeKB * 1024 && quality > MIN_QUALITY) {
        quality -= 0.1;
        blob = await canvas.convertToBlob({ type: "image/webp", quality });
    }

    return blob;
}

/**
 * Create a thumbnail for preview.
 */
export async function createThumbnail(
    file: File,
    maxDimension: number = 300
): Promise<Blob> {
    const bitmap = await createImageBitmap(file);

    let { width, height } = bitmap;
    const ratio = Math.min(maxDimension / width, maxDimension / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    return canvas.convertToBlob({ type: "image/webp", quality: 0.6 });
}

/**
 * Get a preview URL from a File (for immediate UI display).
 */
export function getFilePreviewUrl(file: File): string {
    return URL.createObjectURL(file);
}

/**
 * Clean up a preview URL to avoid memory leaks.
 */
export function revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
}
