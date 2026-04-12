import { getCloudinarySignature } from "@/services/cloudinary";

export async function uploadToCloudinary(
    file: File,
    folder = "holocron/briefs"
): Promise<string> {
    const { signature, timestamp, apiKey, cloudName } =
        await getCloudinarySignature(folder);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    formData.append("folder", folder);

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
    );

    if (!res.ok) {
        throw new Error("Cloudinary upload failed");
    }

    const data = await res.json();
    return data.secure_url as string;
}
