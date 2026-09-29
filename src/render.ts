import {
  ARTBOARD_H,
  ARTBOARD_W,
  SHOW_BAR,
  SHOW_NAME_LINE_HEIGHT,
  SHOW_NAME_MAX_WIDTH,
  SHOW_NAME_SIZE,
  SHOW_NAME_X,
  SHOW_NAME_Y,
  SHOW_RULE,
  SHOW_TIME_SIZE,
  SHOW_TIME_X,
  SHOW_TIME_Y,
  STATION_LABEL_RIGHT,
  clamp,
  logoFrame,
  photoFrame,
} from "./geometry";
import type { Legibility, LogoAdjust, PhotoAdjust, Rect, ShowDetails } from "./types";

export interface RenderInput {
  photo: HTMLImageElement | null;
  photoAdjust: PhotoAdjust;
  logo: HTMLImageElement | null;
  logoAdjust: LogoAdjust | null;
  legibility: Legibility;
  show: ShowDetails;
}

function snappedDrawRect(frame: Rect): Rect {
  const x = Math.floor(frame.x);
  const y = Math.floor(frame.y);
  const right = Math.ceil(frame.x + frame.w);
  const bottom = Math.ceil(frame.y + frame.h);
  return { x, y, w: right - x, h: bottom - y };
}

/**
 * Draw the finished graphic. Order is photo, darken, show bar, logo.
 * The darken overlay stays behind the logo and the show text. Guides are not drawn.
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

  const shift = showBarShift(ctx, input.show);
  drawShow(ctx, input.show, shift);

  const logoBox =
    input.logo && input.logoAdjust
      ? logoFrame(input.logo.naturalWidth, input.logo.naturalHeight, input.logoAdjust)
      : null;

  if (input.logo && logoBox) {
    logoBox.y -= shift;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(input.logo, logoBox.x, logoBox.y, logoBox.w, logoBox.h);
    drawLogoBars(ctx, logoBox);
  }
}

/** How far the lockup grows upward when the show name wraps. */
function showBarShift(ctx: CanvasRenderingContext2D, show: ShowDetails): number {
  const name = show.name.trim().toUpperCase();
  const times = showTimeLine(show).toUpperCase();
  if (!name && !times) return 0;
  ctx.font = `400 ${SHOW_NAME_SIZE}px "Space Mono"`;
  const lines = name ? wrapShowName(ctx, name) : [];
  const extra = Math.max(0, (lines.length - 1) * SHOW_NAME_LINE_HEIGHT);
  const barY = Math.max(0, SHOW_BAR.y - extra);
  return SHOW_BAR.y - barY;
}

/** White bars from the design logo, covering the wordmark so the mark reads as a frame. */
function drawLogoBars(ctx: CanvasRenderingContext2D, box: Rect) {
  const bars = [
    { top: 0.0741, right: 0.0395, bottom: 0.7654, left: 0.0428 },
    { top: 0.7656, right: 0.0395, bottom: 0.0738, left: 0.0428 },
  ];
  ctx.fillStyle = "#fff";
  for (const bar of bars) {
    ctx.fillRect(
      box.x + box.w * bar.left,
      box.y + box.h * bar.top,
      box.w * (1 - bar.left - bar.right),
      box.h * (1 - bar.top - bar.bottom),
    );
  }
}

const PLACEHOLDER_NAME = "show name";
const PLACEHOLDER_TIME = "00pm";
const STATION_LABEL = "MARGATE RADIO";

/** Sample lockup from the design, used only while a field is still empty. */
export function previewShow(show: ShowDetails): ShowDetails {
  return {
    name: show.name.trim() ? show.name : PLACEHOLDER_NAME,
    start: show.start.trim() ? show.start : PLACEHOLDER_TIME,
    end: show.end.trim() ? show.end : PLACEHOLDER_TIME,
  };
}

function showTimeLine(show: ShowDetails): string {
  const start = show.start.trim();
  const end = show.end.trim();
  if (start && end) return `${start} - ${end}`;
  return start || end;
}

function wrapShowName(ctx: CanvasRenderingContext2D, name: string): string[] {
  const words = name.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  function pushWord(word: string) {
    if (ctx.measureText(word).width <= SHOW_NAME_MAX_WIDTH) {
      current = word;
      return;
    }
    let chunk = "";
    for (const char of word) {
      const trial = chunk + char;
      if (ctx.measureText(trial).width <= SHOW_NAME_MAX_WIDTH) {
        chunk = trial;
      } else {
        if (chunk) lines.push(chunk);
        chunk = char;
      }
    }
    current = chunk;
  }

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= SHOW_NAME_MAX_WIDTH) {
      current = next;
    } else {
      if (current) lines.push(current);
      pushWord(word);
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawShow(ctx: CanvasRenderingContext2D, show: ShowDetails, shift: number) {
  const name = show.name.trim().toUpperCase();
  const times = showTimeLine(show).toUpperCase();
  if (!name && !times) return;

  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.letterSpacing = "0px";
  ctx.font = `400 ${SHOW_NAME_SIZE}px "Space Mono"`;
  const lines = name ? wrapShowName(ctx, name) : [];
  const timeGap = SHOW_TIME_Y - SHOW_NAME_Y;
  const barY = SHOW_BAR.y - shift;
  const nameY = SHOW_NAME_Y - shift;
  const timeY = lines.length > 0 ? nameY + (lines.length - 1) * SHOW_NAME_LINE_HEIGHT + timeGap : SHOW_TIME_Y - shift;
  const barH = SHOW_BAR.h + shift;

  ctx.fillStyle = "#000";
  ctx.fillRect(SHOW_BAR.x, barY, SHOW_BAR.w, barH);
  ctx.fillStyle = "#fff";
  const ruleShift = SHOW_BAR.y - barY;
  ctx.fillRect(SHOW_RULE.x, SHOW_RULE.y - ruleShift, SHOW_RULE.w, 1);

  lines.forEach((line, index) => {
    ctx.font = `400 ${SHOW_NAME_SIZE}px "Space Mono"`;
    ctx.fillText(line, SHOW_NAME_X, nameY + index * SHOW_NAME_LINE_HEIGHT);
  });

  if (times) {
    ctx.font = `400 ${SHOW_TIME_SIZE}px "Space Mono"`;
    ctx.fillText(times, SHOW_TIME_X, timeY);
  }

  ctx.font = `400 ${SHOW_TIME_SIZE}px "Space Mono"`;
  ctx.textAlign = "right";
  ctx.fillText(STATION_LABEL, STATION_LABEL_RIGHT, timeY);
  ctx.textAlign = "left";
}

export async function ensureShowFonts(): Promise<void> {
  if (!("fonts" in document)) return;
  await document.fonts.load(`400 ${SHOW_NAME_SIZE}px "Space Mono"`);
}

export async function renderPng(input: RenderInput): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = ARTBOARD_W;
  canvas.height = ARTBOARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("This browser could not create the image.");
  }
  await ensureShowFonts();
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
