/**
 * Image Storage Helpers
 *
 * Uploads images to Cloudflare R2 via the /api/upload API route.
 * Images are served from the custom domain: images.kisekka.online
 */

/**
 * Upload an image to Cloudflare R2 via API route.
 *
 * @param file - The file/blob to upload
 * @param path - Storage path (e.g. "posts/abc123/image1.webp")
 * @returns The public URL of the uploaded image
 */
export async function uploadImage(
    file: Blob,
    path: string
): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", path);

    const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`R2 upload failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (!data.url) {
        throw new Error("Upload succeeded but no URL returned from R2");
    }

    return data.url;
}

/**
 * Delete an image — currently a no-op on R2 (requires separate signed API endpoint).
 * Firebase Storage deletion removed as storage has been migrated to R2.
 */
export async function deleteImage(_path: string): Promise<void> {
    // TODO: implement R2 delete API route when needed
    console.warn("deleteImage: R2 deletion not yet implemented");
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
 * Get the public URL for an R2-stored image given its path.
 */
export function getR2ImageUrl(path: string): string {
    const base =
        process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://images.kisekka.online";
    return `${base}/${path}`;
}
