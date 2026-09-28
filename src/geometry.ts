import type { LogoAdjust, PhotoAdjust, Rect } from "./types";

export const ARTBOARD_W = 1080;
export const ARTBOARD_H = 1350;

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
export const MAX_DARKEN = 0.8;
/** Bottom-right logo from the 1080×1350 Instagram post frame. */
export const LOGO_X = 740;
export const LOGO_Y = 1044;
export const LOGO_WIDTH = 292;
export const LOGO_HEIGHT = 258;
export const MIN_LOGO_WIDTH = 180;

export const DEFAULT_PHOTO: PhotoAdjust = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface PhotoFrame extends Rect {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

/** Scale and pan that always cover the artboard. Zoom 1 is the smallest cover fit. */
export function photoFrame(imgW: number, imgH: number, adjust: PhotoAdjust): PhotoFrame {
  const zoom = clamp(adjust.zoom, MIN_ZOOM, MAX_ZOOM);
  const cover = Math.max(ARTBOARD_W / imgW, ARTBOARD_H / imgH);
  const w = imgW * cover * zoom;
  const h = imgH * cover * zoom;
  const maxX = (w - ARTBOARD_W) / 2;
  const maxY = (h - ARTBOARD_H) / 2;
  const offsetX = clamp(adjust.offsetX, -maxX, maxX);
  const offsetY = clamp(adjust.offsetY, -maxY, maxY);
  return {
    x: (ARTBOARD_W - w) / 2 + offsetX,
    y: (ARTBOARD_H - h) / 2 + offsetY,
    w,
    h,
    zoom,
    offsetX,
    offsetY,
  };
}

export function maxLogoWidth(naturalW: number, naturalH: number): number {
  const maxByHeight = ARTBOARD_H * (naturalW / naturalH);
  return Math.min(ARTBOARD_W, maxByHeight);
}

export function logoFrame(naturalW: number, naturalH: number, adjust: LogoAdjust): Rect {
  const max = maxLogoWidth(naturalW, naturalH);
  const min = Math.min(MIN_LOGO_WIDTH, max);
  const w = clamp(adjust.width, min, max);
  const h = w * (naturalH / naturalW);
  return {
    w,
    h,
    x: clamp(adjust.x, 0, ARTBOARD_W - w),
    y: clamp(adjust.y, 0, ARTBOARD_H - h),
  };
}

export function defaultLogoAdjust(naturalW: number, naturalH: number): LogoAdjust {
  const width = Math.min(LOGO_WIDTH, maxLogoWidth(naturalW, naturalH));
  return {
    width,
    x: LOGO_X,
    y: LOGO_Y,
  };
}

export function coversArtboard(frame: Rect, epsilon = 1e-6): boolean {
  return (
    frame.x <= epsilon &&
    frame.y <= epsilon &&
    frame.x + frame.w >= ARTBOARD_W - epsilon &&
    frame.y + frame.h >= ARTBOARD_H - epsilon
  );
}
