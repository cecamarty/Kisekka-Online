/**
 * API Route: Image Upload to Cloudflare R2
 *
 * Handles multipart form data uploads, stores to R2 via S3 API,
 * and returns the public URL via the custom domain.
 *
 * POST /api/upload
 * Body: FormData with "file" (Blob) and "path" (string) fields
 * Returns: { url: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as Blob | null;
        const path = formData.get("path") as string | null;

        if (!file || !path) {
            return NextResponse.json(
                { error: "Missing file or path" },
                { status: 400 }
            );
        }

        // Convert Blob to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to R2
        await s3.send(
            new PutObjectCommand({
                Bucket: BUCKET,
                Key: path,
                Body: buffer,
                ContentType: file.type || "image/webp",
                // Make publicly readable (R2 handles this via custom domain)
                CacheControl: "public, max-age=31536000, immutable",
            })
        );

        // Return the public URL via custom domain
        const url = `${PUBLIC_URL}/${path}`;

        return NextResponse.json({ url });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Upload failed" },
            { status: 500 }
        );
    }
}
