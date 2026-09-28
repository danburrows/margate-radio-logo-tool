import { MAX_DARKEN, MAX_ZOOM, MIN_ZOOM } from "./geometry";
import type { Legibility, LoadedImage, PhotoAdjust } from "./types";

interface ControlsProps {
  photo: LoadedImage | null;
  photoAdjust: PhotoAdjust;
  onZoom: (zoom: number) => void;
  onResetPhoto: () => void;
  onUploadPhoto: () => void;
  legibility: Legibility;
  onLegibility: (next: Legibility) => void;
  busy: boolean;
  onDownload: () => void;
}

export function Controls({
  photo,
  photoAdjust,
  onZoom,
  onResetPhoto,
  onUploadPhoto,
  legibility,
  onLegibility,
  busy,
  onDownload,
}: ControlsProps) {
  return (
    <aside className="panel">
      <div className="panel-body">
        <section className="section">
          <h2>1. Upload photo</h2>
          <p className="section-help">JPG, PNG, or WebP. The picture is 1080 × 1350. Drag to crop it.</p>
          <button type="button" className="primary" onClick={onUploadPhoto}>
            Upload photo
          </button>
          {photo ? (
            <p className="file-name" title={photo.name}>
              {photo.name}
            </p>
          ) : (
            <p className="hint">No photo yet.</p>
          )}
          <div className="child-controls">
            <Slider
              id="photo-zoom"
              label="Zoom"
              value={photoAdjust.zoom}
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              display={`${Math.round(photoAdjust.zoom * 100)}%`}
              disabled={!photo}
              onChange={onZoom}
            />
            <button
              type="button"
              className="secondary"
              onClick={onResetPhoto}
              disabled={!photo}
            >
              Reset position
            </button>
          </div>
        </section>

        <section className="section">
          <h2>2. Position image</h2>
          <p className="section-help">Drag the image to position it within the frame.</p>
        </section>

        <section className="section">
          <h2>3. Make it readable</h2>
          <p className="section-help">
            If the logo is hard to see, darken the photo. The logo colours stay as they are.
          </p>
          <Slider
            id="darken"
            label="Darken photo"
            value={legibility.darken}
            min={0}
            max={MAX_DARKEN}
            step={0.01}
            display={`${Math.round(legibility.darken * 100)}%`}
            disabled={!photo}
            onChange={(darken) => onLegibility({ ...legibility, darken })}
          />
        </section>

        <p className="hint download-note">
          {photo
            ? "The PNG is 1080 × 1350. Editing outlines are left out."
            : "Upload a photo to enable download."}
        </p>
        <p className="privacy">Your photos stay in this browser. Nothing is uploaded.</p>
      </div>

      <div className="download-bar">
        <button type="button" className="primary download" onClick={onDownload} disabled={!photo || busy}>
          {busy ? "Preparing PNG…" : "Download PNG"}
        </button>
      </div>
    </aside>
  );
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="field">
      <div className="field-label">
        <label htmlFor={id}>{label}</label>
        <span>{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : min}
        disabled={disabled}
        aria-valuetext={display}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
