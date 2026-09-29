import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ARTBOARD_H, ARTBOARD_W, photoBounds, photoFrame } from "./geometry";
import { ensureShowFonts, previewShow, renderArtboard } from "./render";
import type { Legibility, LoadedImage, LogoAdjust, PhotoAdjust, ShowDetails, TemplateId } from "./types";

interface ArtboardProps {
  photo: LoadedImage | null;
  photoAdjust: PhotoAdjust;
  logo: LoadedImage | null;
  logoAdjust: LogoAdjust | null;
  template: TemplateId;
  legibility: Legibility;
  show: ShowDetails;
  onPhotoAdjust: (next: PhotoAdjust) => void;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

export function Artboard({
  photo,
  photoAdjust,
  logo,
  logoAdjust,
  template,
  legibility,
  show,
  onPhotoAdjust,
}: ArtboardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const photoRef = useRef(photo);
  const photoAdjustRef = useRef(photoAdjust);
  const templateRef = useRef(template);
  const [dragging, setDragging] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);

  photoRef.current = photo;
  photoAdjustRef.current = photoAdjust;
  templateRef.current = template;

  useEffect(() => {
    let cancelled = false;
    ensureShowFonts().then(() => {
      if (!cancelled) setFontsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.width !== ARTBOARD_W) canvas.width = ARTBOARD_W;
    if (canvas.height !== ARTBOARD_H) canvas.height = ARTBOARD_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderArtboard(ctx, {
      photo: photo?.element ?? null,
      photoAdjust,
      logo: logo?.element ?? null,
      template,
      logoAdjust,
      legibility,
      show: previewShow(show, template),
    });
  }, [photo, photoAdjust, logo, logoAdjust, template, legibility, show, fontsReady]);

  function artboardScale(): number {
    const board = boardRef.current;
    if (!board) return 1;
    const width = board.getBoundingClientRect().width;
    return width > 0 ? width / ARTBOARD_W : 1;
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !photo) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: photoAdjust.offsetX,
      originY: photoAdjust.offsetY,
    };
    setDragging(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some browsers only capture trusted pointers. Moves still arrive on the artboard.
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const currentPhoto = photoRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !currentPhoto) return;
    const scale = artboardScale();
    const dx = (event.clientX - drag.startX) / scale;
    const dy = (event.clientY - drag.startY) / scale;
    const frame = photoFrame(
      currentPhoto.element.naturalWidth,
      currentPhoto.element.naturalHeight,
      {
        zoom: photoAdjustRef.current.zoom,
        offsetX: drag.originX + dx,
        offsetY: drag.originY + dy,
      },
      photoBounds(templateRef.current),
    );
    onPhotoAdjust({ zoom: frame.zoom, offsetX: frame.offsetX, offsetY: frame.offsetY });
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
  }

  const className = ["artboard", dragging ? "is-dragging" : "", photo ? "is-photo" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={boardRef}
      className={className}
      role="region"
      aria-label="Preview. Drag to move the photo. The logo stays still."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onContextMenu={(event) => event.preventDefault()}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
