"use server";

import crypto from "crypto";

export async function getCloudinarySignature(folder = "holocron") {
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!apiSecret || !apiKey || !cloudName) {
        throw new Error("Cloudinary environment variables are not configured");
    }

    const timestamp = Math.round(Date.now() / 1000);
    const params: Record<string, string | number> = { folder, timestamp };

    // Cloudinary signing: alphabetically sorted key=value pairs joined by &, then append secret
    const signatureBase = Object.keys(params)
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join("&") + apiSecret;

    const signature = crypto
        .createHash("sha1")
        .update(signatureBase)
        .digest("hex");

    return { signature, timestamp, apiKey, cloudName };
}
