// Runs in the browser before a document is uploaded. Phones often give big
// photos, HEIC photos from iPhones, or files without a type, so photos are
// turned into a JPEG of at most MAX_SIDE pixels and the type is checked here,
// before anything reaches storage.

import { ACCEPTED_MIME, MAX_FILE_BYTES } from "./documents";

const MAX_SIDE = 2000;

const BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

export type Prepared = { file: File; mimeType: string; ext: string } | { error: "unsupported" | "too_big" };

function extensionOf(name: string) {
  return name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file);
  } catch {
    // Safari can show HEIC in an <img> even when createImageBitmap refuses it.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

async function toJpeg(file: File): Promise<File | null> {
  try {
    const image = await decode(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) return null;
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return null;
  }
}

export async function prepareUpload(file: File): Promise<Prepared> {
  const mimeType = file.type || BY_EXTENSION[extensionOf(file.name)] || "";

  if (mimeType === "application/pdf") {
    if (file.size > MAX_FILE_BYTES) return { error: "too_big" };
    return { file, mimeType, ext: "pdf" };
  }

  if (mimeType.startsWith("image/")) {
    const jpeg = await toJpeg(file);
    if (jpeg) return { file: jpeg, mimeType: "image/jpeg", ext: "jpg" };
    // Could not convert: keep the original if storage and AI accept it as is.
    if (!ACCEPTED_MIME.includes(mimeType)) return { error: "unsupported" };
    if (file.size > MAX_FILE_BYTES) return { error: "too_big" };
    return { file, mimeType, ext: extensionOf(file.name) || "jpg" };
  }

  return { error: "unsupported" };
}
