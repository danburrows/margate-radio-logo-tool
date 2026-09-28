import { MAX_ZOOM, MIN_ZOOM } from "./geometry";
import type { LoadedImage, PhotoAdjust, ShowDetails } from "./types";

interface ControlsProps {
  photo: LoadedImage | null;
  photoAdjust: PhotoAdjust;
  onZoom: (zoom: number) => void;
  onResetPhoto: () => void;
  onUploadPhoto: () => void;
  show: ShowDetails;
  onShow: (next: ShowDetails) => void;
  busy: boolean;
  onDownload: () => void;
}

export function Controls({
  photo,
  photoAdjust,
  onZoom,
  onResetPhoto,
  onUploadPhoto,
  show,
  onShow,
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
          <h2>3. Name your show</h2>
          <p className="section-help">
            The picture shows show name and 00pm - 00pm until you type your own.
          </p>
          <div className="field">
            <label className="field-label" htmlFor="show-name">
              Show name
            </label>
            <input
              id="show-name"
              className="text-input"
              type="text"
              placeholder="show name"
              value={show.name}
              maxLength={80}
              onChange={(event) => onShow({ ...show, name: event.target.value })}
            />
          </div>
          <div className="time-row">
            <div className="field">
              <label className="field-label" htmlFor="show-start">
                Start time
              </label>
              <input
                id="show-start"
                className="text-input"
                type="text"
                inputMode="text"
                placeholder="12pm"
                value={show.start}
                maxLength={20}
                onChange={(event) => onShow({ ...show, start: event.target.value })}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="show-end">
                End time
              </label>
              <input
                id="show-end"
                className="text-input"
                type="text"
                inputMode="text"
                placeholder="2pm"
                value={show.end}
                maxLength={20}
                onChange={(event) => onShow({ ...show, end: event.target.value })}
              />
            </div>
          </div>
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
