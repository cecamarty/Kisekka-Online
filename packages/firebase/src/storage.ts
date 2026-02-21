/**
 * Firebase Storage Helpers
 *
 * Image upload with client-side compression.
 */

import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} from "firebase/storage";
import { storage } from "./config";

/**
 * Upload an image to Firebase Storage.
 * @param file - The file/blob to upload
 * @param path - Storage path (e.g. "posts/abc123/image1.webp")
 * @returns The download URL of the uploaded image
 */
export async function uploadImage(
    file: Blob,
    path: string
): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file, {
        contentType: "image/webp",
    });
    return getDownloadURL(snapshot.ref);
}

/**
 * Delete an image from Firebase Storage.
 */
export async function deleteImage(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
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
