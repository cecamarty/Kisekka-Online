/**
 * Image Compression Utilities
 *
 * Client-side image compression for data-light usage.
 * Target: WebP format, ≤200KB per image.
 *
 * Uses a regular <canvas> for broad browser compatibility (including iOS Safari).
 * Falls back to the original file if compression fails.
 */

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const TARGET_SIZE_KB = 200;
const INITIAL_QUALITY = 0.8;
const MIN_QUALITY = 0.3;

/**
 * Compress an image file using a regular canvas (iOS/Android compatible).
 * Falls back to the original file blob if any step fails.
 */
export async function compressImage(
    file: File,
    maxSizeKB: number = TARGET_SIZE_KB
): Promise<Blob> {
    return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            try {
                // Calculate scaled dimensions
                let { width, height } = img;
                if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                    const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    // Canvas context unavailable — return original
                    resolve(file);
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Try WebP first, fall back to JPEG for iOS
                const mimeType = canvas.toDataURL("image/webp").startsWith(
                    "data:image/webp"
                )
                    ? "image/webp"
                    : "image/jpeg";

                // Iteratively reduce quality until under target size
                let quality = INITIAL_QUALITY;

                const tryBlob = () => {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                resolve(file);
                                return;
                            }
                            if (
                                blob.size > maxSizeKB * 1024 &&
                                quality > MIN_QUALITY
                            ) {
                                quality = Math.max(quality - 0.1, MIN_QUALITY);
                                tryBlob();
                            } else {
                                resolve(blob);
                            }
                        },
                        mimeType,
                        quality
                    );
                };

                tryBlob();
            } catch {
                // Any canvas error — return the original file
                resolve(file);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            // Image couldn't be loaded — return original file
            resolve(file);
        };

        img.src = objectUrl;
    });
}

/**
 * Create a thumbnail for preview.
 */
export async function createThumbnail(
    file: File,
    maxDimension: number = 300
): Promise<Blob> {
    return compressImage(file, 50); // reuse compress with smaller target
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
