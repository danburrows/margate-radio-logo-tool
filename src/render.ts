import {
  ARTBOARD_H,
  ARTBOARD_W,
  SHOW_BAR,
  SHOW_HYPHEN_LINE_HEIGHT,
  SHOW_HYPHEN_SIZE,
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
  STATION_LABEL_SIZE,
  STATION_LABEL_Y,
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

const CHECKER_SIZE = 45;
const CHECKER_LIGHT = "#ffffff";
const CHECKER_DARK = "#c8c8c8";

/** Grey and white squares shown until a photo is uploaded. */
function drawChecker(ctx: CanvasRenderingContext2D) {
  for (let y = 0; y < ARTBOARD_H; y += CHECKER_SIZE) {
    for (let x = 0; x < ARTBOARD_W; x += CHECKER_SIZE) {
      const column = x / CHECKER_SIZE;
      const row = y / CHECKER_SIZE;
      ctx.fillStyle = (column + row) % 2 === 0 ? CHECKER_LIGHT : CHECKER_DARK;
      ctx.fillRect(x, y, CHECKER_SIZE, CHECKER_SIZE);
    }
  }
}

const TEXT_SUPERSAMPLE = 3;
const TEXT_PAD = 4;

/** Draw type at a higher resolution, then scale it down for smoother edges. */
function fillTextSmooth(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  const width = ctx.measureText(text).width;
  const fontSize = Number.parseFloat(ctx.font) || SHOW_NAME_SIZE;
  const boxW = Math.ceil(width + TEXT_PAD * 2);
  const boxH = Math.ceil(fontSize * 1.4 + TEXT_PAD * 2);
  const off = document.createElement("canvas");
  off.width = boxW * TEXT_SUPERSAMPLE;
  off.height = boxH * TEXT_SUPERSAMPLE;
  const offCtx = off.getContext("2d");
  if (!offCtx) {
    ctx.fillText(text, x, y);
    return;
  }

  offCtx.setTransform(TEXT_SUPERSAMPLE, 0, 0, TEXT_SUPERSAMPLE, 0, 0);
  offCtx.font = ctx.font;
  offCtx.fillStyle = ctx.fillStyle;
  offCtx.letterSpacing = ctx.letterSpacing;
  offCtx.textAlign = "left";
  offCtx.textBaseline = "top";
  offCtx.fillText(text, TEXT_PAD, TEXT_PAD);

  let destX = x - TEXT_PAD;
  if (ctx.textAlign === "right") destX = x - width - TEXT_PAD;
  else if (ctx.textAlign === "center") destX = x - width / 2 - TEXT_PAD;

  const smoothing = ctx.imageSmoothingEnabled;
  const quality = ctx.imageSmoothingQuality;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(off, destX, y - TEXT_PAD, boxW, boxH);
  ctx.imageSmoothingEnabled = smoothing;
  ctx.imageSmoothingQuality = quality;
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

  if (input.photo) {
    ctx.fillStyle = "#14120f";
    ctx.fillRect(0, 0, ARTBOARD_W, ARTBOARD_H);
    const frame = photoFrame(
      input.photo.naturalWidth,
      input.photo.naturalHeight,
      input.photoAdjust,
    );
    const draw = snappedDrawRect(frame);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(input.photo, draw.x, draw.y, draw.w, draw.h);
  } else {
    drawChecker(ctx);
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

/** Draw the time with a smaller hyphen, bottom-aligned to the time line. */
function drawTimeLine(ctx: CanvasRenderingContext2D, show: ShowDetails, x: number, y: number) {
  const start = show.start.trim().toUpperCase();
  const end = show.end.trim().toUpperCase();
  const gap = 4;
  let cursor = x;

  ctx.textAlign = "left";
  if (start) {
    ctx.font = `400 ${SHOW_TIME_SIZE}px "Space Mono"`;
    fillTextSmooth(ctx, start, cursor, y);
    cursor += ctx.measureText(start).width;
  }
  if (start && end) {
    cursor += gap;
    ctx.font = `400 ${SHOW_HYPHEN_SIZE}px "Space Mono"`;
    fillTextSmooth(ctx, "-", cursor, y + SHOW_NAME_LINE_HEIGHT - SHOW_HYPHEN_LINE_HEIGHT);
    cursor += ctx.measureText("-").width + gap;
  }
  if (end) {
    ctx.font = `400 ${SHOW_TIME_SIZE}px "Space Mono"`;
    fillTextSmooth(ctx, end, cursor, y);
  }
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
    fillTextSmooth(ctx, line, SHOW_NAME_X, nameY + index * SHOW_NAME_LINE_HEIGHT);
  });

  if (times) {
    drawTimeLine(ctx, show, SHOW_TIME_X, timeY);
  }

  ctx.font = `400 ${STATION_LABEL_SIZE}px "Space Mono"`;
  ctx.textAlign = "right";
  fillTextSmooth(ctx, STATION_LABEL, STATION_LABEL_RIGHT, STATION_LABEL_Y);
  ctx.textAlign = "left";
}

export async function ensureShowFonts(): Promise<void> {
  if (!("fonts" in document)) return;
  await Promise.all([
    document.fonts.load(`400 ${SHOW_NAME_SIZE}px "Space Mono"`),
    document.fonts.load(`400 ${SHOW_HYPHEN_SIZE}px "Space Mono"`),
    document.fonts.load(`400 ${STATION_LABEL_SIZE}px "Space Mono"`),
  ]);
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
