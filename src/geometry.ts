import type { LogoAdjust, PhotoAdjust, Rect, TemplateId } from "./types";

export const ARTBOARD_W = 1080;
export const ARTBOARD_H = 1350;

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
export const MAX_DARKEN = 0.8;
/** Bottom lockup from the 1080×1350 post: text bar on the left, logo on the right. */
export const LOGO_X = 939;
export const LOGO_Y = 1197;
export const LOGO_WIDTH = 101;
export const LOGO_HEIGHT = 89;
export const MIN_LOGO_WIDTH = 80;

export const SHOW_BAR = { x: 32, y: 1189, w: 1016, h: 105 };
/** White rule on the text column, 8px inside the black bar, stopping 4px before the logo. */
export const SHOW_RULE = { x: 44, y: 1197, w: 891 };
export const SHOW_NAME_X = 44;
export const SHOW_NAME_Y = 1203;
export const SHOW_NAME_MAX_WIDTH = 887;
export const SHOW_NAME_SIZE = 37;
/** Space Mono at 37px with a 0.9 line height, matching the design text box. */
export const SHOW_NAME_LINE_HEIGHT = 33;
export const SHOW_TIME_X = 44;
export const SHOW_TIME_Y = 1258;
export const SHOW_TIME_SIZE = 27;
/** Space Mono at 27px with a 0.9 line height. */
export const SHOW_TIME_LINE_HEIGHT = 24;
export const SHOW_HYPHEN_SIZE = 32;
export const SHOW_HYPHEN_LINE_HEIGHT = 29;
export const STATION_LABEL_SIZE = 24;
/** Right edge of the station name, 12px inside the text column. */
export const STATION_LABEL_RIGHT = 923;
export const STATION_LABEL_Y = 1262;

/** Portrait photo window on the Faces template. */
export const FACES_PHOTO: Rect = { x: 152, y: 0, w: 780, h: 1122 };
export const FACES_LOGO_BAR = { x: 0, y: 268, w: 232, h: 101 };
export const FACES_LOGO = { x: 122, y: 280, w: 87, h: 77 };
export const FACES_NAME_BAR = { x: 212, y: 1084, w: 892, h: 44 };
export const FACES_NAME_X = 220;
export const FACES_NAME_Y = 1083;
export const FACES_NAME_MAX_WIDTH = 880;
export const FACES_NAME_SIZE = 52;
export const FACES_NAME_TRACKING = -3.64;
export const FACES_WORD_SIZE = 318;
export const FACES_WORD_TRACKING = -22.27;
export const FACES_WORD_X = 552;
export const FACES_WORD_Y = 1110;
export const FACES_SUBTITLE = { x: 422, y: 1146, w: 260, h: 48 };
export const FACES_MARGATE = { x: 422, y: 1159 };
export const FACES_RADIO = { x: 605, y: 1159 };
export const FACES_SUBTITLE_SIZE = 25;
/** Decorative marks, rotated 180° in the design. */
export const FACES_MARKS = { x: -300, y: 744, w: 1490, h: 490 };

const FULL_PHOTO: Rect = { x: 0, y: 0, w: ARTBOARD_W, h: ARTBOARD_H };

export function photoBounds(template: TemplateId): Rect {
  return template === "faces" ? FACES_PHOTO : FULL_PHOTO;
}

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

/** Scale and pan that always cover the target rectangle. Zoom 1 is the smallest cover fit. */
export function photoFrame(
  imgW: number,
  imgH: number,
  adjust: PhotoAdjust,
  bounds: Rect = FULL_PHOTO,
): PhotoFrame {
  const zoom = clamp(adjust.zoom, MIN_ZOOM, MAX_ZOOM);
  const cover = Math.max(bounds.w / imgW, bounds.h / imgH);
  const w = imgW * cover * zoom;
  const h = imgH * cover * zoom;
  const maxX = (w - bounds.w) / 2;
  const maxY = (h - bounds.h) / 2;
  const offsetX = clamp(adjust.offsetX, -maxX, maxX);
  const offsetY = clamp(adjust.offsetY, -maxY, maxY);
  return {
    x: bounds.x + (bounds.w - w) / 2 + offsetX,
    y: bounds.y + (bounds.h - h) / 2 + offsetY,
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
