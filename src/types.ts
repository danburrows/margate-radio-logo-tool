export interface PhotoAdjust {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface LogoAdjust {
  width: number;
  x: number;
  y: number;
}

export interface Legibility {
  /** 0–MAX_DARKEN. Black overlay on the photo, drawn under the logo. */
  darken: number;
}

export interface LoadedImage {
  element: HTMLImageElement;
  name: string;
  /** Blob URL for an upload. Null for the built-in station logo. */
  objectUrl: string | null;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
