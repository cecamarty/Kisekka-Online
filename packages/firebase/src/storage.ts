/**
 * Image Storage Helpers
 *
 * Uploads images to Cloudflare R2 via the /api/upload API route.
 * Images are served from the custom domain: images.kisekka.online
 *
 * Falls back gracefully if the API route is unavailable.
 */

// Keep Firebase Storage imports for backward compatibility / migration
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} from "firebase/storage";
import { storage } from "./config";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://images.kisekka.online";

/**
 * Upload an image to Cloudflare R2 via API route.
 * Falls back to Firebase Storage if R2 upload fails.
 *
 * @param file - The file/blob to upload
 * @param path - Storage path (e.g. "posts/abc123/image1.webp")
 * @returns The public URL of the uploaded image
 */
export async function uploadImage(
    file: Blob,
    path: string
): Promise<string> {
    try {
        // Try R2 upload via API route
        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", path);

        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }

        const data = await response.json();
        return data.url;
    } catch (error) {
        console.warn("R2 upload failed, falling back to Firebase Storage:", error);

        // Fallback to Firebase Storage
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file, {
            contentType: "image/webp",
        });
        return getDownloadURL(snapshot.ref);
    }
}

/**
 * Delete an image from Firebase Storage.
 * Note: R2 deletion would require a separate API route.
 */
export async function deleteImage(path: string): Promise<void> {
    try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
    } catch (error) {
        console.warn("Delete failed:", error);
    }
}

/**
 * Generate a unique storage path for an image upload.
 */
export function generateImagePath(
    folder: string,
    userId: string,
    filename: string
): string {
    const timestamp = Date.now();
    const cleanName = filename.replace(/[^a-zA-Z0-9.]/g, "_");
    return `${folder}/${userId}/${timestamp}_${cleanName}`;
}

/**
 * Get the public URL for an R2-stored image.
 */
export function getR2ImageUrl(path: string): string {
    return `${R2_PUBLIC_URL}/${path}`;
}
