import type { LoadedImage } from "./types";

const MAX_FILE_BYTES = 40 * 1024 * 1024;

function extension(name: string): string {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
}

function fileTooLarge(file: File, label: string): string | null {
  if (file.size === 0) return "That file is empty. Please choose a different image.";
  if (file.size > MAX_FILE_BYTES) {
    return `That ${label} is too large. Please choose one under 40 MB.`;
  }
  return null;
}

export function photoFileError(file: File): string | null {
  const sizeError = fileTooLarge(file, "photo");
  if (sizeError) return sizeError;

  const ext = extension(file.name);
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif" || ext === ".heic" || ext === ".heif") {
    return "HEIC photos from iPhones need to be saved as JPG first. Please choose a JPG, PNG, or WebP.";
  }

  const allowedType =
    type === "image/jpeg" || type === "image/jpg" || type === "image/png" || type === "image/webp";
  const allowedExt = ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".webp";
  const missingType = type === "" || type === "application/octet-stream";
  if (allowedType || (missingType && allowedExt)) return null;
  return "That file is not a photo this tool can use. Please choose a JPG, PNG, or WebP.";
}

export function logoFileError(file: File): string | null {
  const sizeError = fileTooLarge(file, "logo");
  if (sizeError) return sizeError;

  const ext = extension(file.name);
  const type = file.type.toLowerCase();
  const allowedType = type === "image/png" || type === "image/svg+xml";
  const allowedExt = ext === ".png" || ext === ".svg";
  const missingType = type === "" || type === "application/octet-stream";
  if (allowedType || (missingType && allowedExt)) return null;
  return "That file is not a logo this tool can use. Please choose a PNG or SVG.";
}

function svgAspect(svg: string): number {
  const viewBox = svg.match(/viewBox="\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)\s*"/);
  if (!viewBox) return 1;
  const width = Number(viewBox[1]);
  const height = Number(viewBox[2]);
  if (!width || !height) return 1;
  return height / width;
}

/** Rasterise an SVG at a chosen width so it stays sharp when drawn on the artboard. */
export async function imageFromSvg(svg: string, width: number): Promise<LoadedImage> {
  const height = Math.max(1, Math.round(width * svgAspect(svg)));
  const sized = svg.replace(/<svg\b[^>]*>/, (open) =>
    open.replace(/width="[^"]*"/, `width="${width}"`).replace(/height="[^"]*"/, `height="${height}"`),
  );
  const objectUrl = URL.createObjectURL(new Blob([sized], { type: "image/svg+xml" }));
  try {
    const element = await loadImageElement(objectUrl);
    return { element, name: "Margate Radio logo", objectUrl };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (image.naturalWidth < 1 || image.naturalHeight < 1) {
        reject(new Error("no-size"));
        return;
      }
      resolve(image);
    };
    image.onerror = () => reject(new Error("decode"));
    image.src = src;
  });
}

export async function imageFromFile(file: File): Promise<LoadedImage> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const element = await loadImageElement(objectUrl);
    return { element, name: file.name, objectUrl };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}
