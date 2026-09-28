import { ARTBOARD_H, ARTBOARD_W, clamp, logoFrame, photoFrame } from "./geometry";
import type { Legibility, LogoAdjust, PhotoAdjust, Rect } from "./types";

export interface RenderInput {
  photo: HTMLImageElement | null;
  photoAdjust: PhotoAdjust;
  logo: HTMLImageElement | null;
  logoAdjust: LogoAdjust | null;
  legibility: Legibility;
}

function snappedDrawRect(frame: Rect): Rect {
  const x = Math.floor(frame.x);
  const y = Math.floor(frame.y);
  const right = Math.ceil(frame.x + frame.w);
  const bottom = Math.ceil(frame.y + frame.h);
  return { x, y, w: right - x, h: bottom - y };
}

/**
 * Draw the finished graphic. Order is photo, darken, logo.
 * The darken overlay stays behind the logo so its colours are unchanged. Guides are not drawn.
 */
export function renderArtboard(ctx: CanvasRenderingContext2D, input: RenderInput) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ARTBOARD_W, ARTBOARD_H);
  ctx.fillStyle = "#14120f";
  ctx.fillRect(0, 0, ARTBOARD_W, ARTBOARD_H);

  if (input.photo) {
    const frame = photoFrame(
      input.photo.naturalWidth,
      input.photo.naturalHeight,
      input.photoAdjust,
    );
    const draw = snappedDrawRect(frame);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(input.photo, draw.x, draw.y, draw.w, draw.h);
  }

  const darken = clamp(input.legibility.darken, 0, 1);
  if (darken > 0) {
    ctx.fillStyle = `rgba(0,0,0,${darken})`;
    ctx.fillRect(0, 0, ARTBOARD_W, ARTBOARD_H);
  }

  const logoBox =
    input.logo && input.logoAdjust
      ? logoFrame(input.logo.naturalWidth, input.logo.naturalHeight, input.logoAdjust)
      : null;

  if (input.logo && logoBox) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(input.logo, logoBox.x, logoBox.y, logoBox.w, logoBox.h);
  }
}

export async function renderPng(input: RenderInput): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = ARTBOARD_W;
  canvas.height = ARTBOARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("This browser could not create the image.");
  }
  renderArtboard(ctx, input);
  try {
    ctx.getImageData(0, 0, 1, 1);
  } catch {
    throw new Error(
      "The logo could not be included. Try a self-contained PNG instead of this SVG.",
    );
  }
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/png");
  });
  if (!blob) {
    throw new Error("The picture could not be created. Please try again.");
  }
  return blob;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const DOWNLOAD_FILENAME = "margate-radio.png";
