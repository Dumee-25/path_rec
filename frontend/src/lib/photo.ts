/** Turning a camera frame or a chosen file into the small JPEG that gets uploaded. */

/** Longest side of the uploaded photo: plenty for a portrait, and much faster to send. */
export const MAX_PHOTO_SIDE = 1024;
const JPEG_QUALITY = 0.9;

/** Largest file a person can pick. Phone photos are commonly 5 to 12 MB; they are shrunk before upload. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const ACCEPTED_UPLOAD_TYPES = "image/jpeg,image/png,image/webp";

/** A problem with a chosen file, with a message that is fit to show to the person. */
export class PhotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoError";
  }
}

export function scaleToFit(width: number, height: number, maxSide = MAX_PHOTO_SIDE): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Draw a video frame or decoded image to a canvas no larger than MAX_PHOTO_SIDE and encode it as JPEG. */
export function drawToJpeg(source: CanvasImageSource, width: number, height: number): Promise<Blob | null> {
  const size = scaleToFit(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.resolve(null);
  // JPEG has no transparency; without a backdrop a transparent PNG would turn black.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size.width, size.height);
  context.drawImage(source, 0, 0, size.width, size.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
}

/**
 * Read a chosen image file as an upright JPEG of at most MAX_PHOTO_SIDE pixels.
 * Anything the browser can display works, so WebP is fine even though the server wants JPEG.
 */
export async function fileToJpeg(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new PhotoError("Choose an image file, such as a JPEG or PNG photo.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new PhotoError("That file is too large. Choose a photo smaller than 25 MB.");
  }

  let bitmap: ImageBitmap;
  try {
    // "from-image" applies the camera's rotation, so phone portraits are not sideways.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new PhotoError("That image could not be read. Try a JPEG or PNG photo.");
  }
  try {
    const blob = await drawToJpeg(bitmap, bitmap.width, bitmap.height);
    if (!blob) throw new PhotoError("That image could not be read. Try a JPEG or PNG photo.");
    return blob;
  } finally {
    bitmap.close();
  }
}
