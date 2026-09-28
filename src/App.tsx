import { useEffect, useRef, useState } from "react";
import stationLogoSvg from "../images/Logo.svg?raw";
import { Artboard } from "./Artboard";
import { Controls } from "./Controls";
import { DEFAULT_PHOTO, LOGO_WIDTH, MAX_DARKEN, clamp, defaultLogoAdjust, photoFrame } from "./geometry";
import { imageFromFile, imageFromSvg, photoFileError } from "./files";
import { DOWNLOAD_FILENAME, downloadBlob, renderPng } from "./render";
import type { Legibility, LoadedImage, LogoAdjust, PhotoAdjust } from "./types";

const INITIAL_LEGIBILITY: Legibility = {
  darken: 0,
};

export function App() {
  const [photo, setPhoto] = useState<LoadedImage | null>(null);
  const [photoAdjust, setPhotoAdjust] = useState<PhotoAdjust>(DEFAULT_PHOTO);
  const [logo, setLogo] = useState<LoadedImage | null>(null);
  const [logoAdjust, setLogoAdjust] = useState<LogoAdjust | null>(null);
  const [legibility, setLegibility] = useState<Legibility>(INITIAL_LEGIBILITY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoRequest = useRef(0);
  const photoUrl = useRef<string | null>(null);
  const logoUrl = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const logoWidth = LOGO_WIDTH * 2;
    imageFromSvg(stationLogoSvg, logoWidth)
      .then((loaded) => {
        if (cancelled) {
          if (loaded.objectUrl) URL.revokeObjectURL(loaded.objectUrl);
          return;
        }
        logoUrl.current = loaded.objectUrl;
        setLogo(loaded);
        setLogoAdjust(defaultLogoAdjust(loaded.element.naturalWidth, loaded.element.naturalHeight));
      })
      .catch(() => {
        if (cancelled) return;
        setError("The station logo could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const photoObjectUrl = photoUrl;
    const logoObjectUrl = logoUrl;
    return () => {
      if (photoObjectUrl.current) URL.revokeObjectURL(photoObjectUrl.current);
      if (logoObjectUrl.current) URL.revokeObjectURL(logoObjectUrl.current);
    };
  }, []);

  function openPhotoPicker() {
    const input = photoInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }

  async function onPhotoPicked(file: File) {
    const problem = photoFileError(file);
    if (problem) {
      setError(problem);
      return;
    }
    const requestId = ++photoRequest.current;
    try {
      const loaded = await imageFromFile(file);
      if (requestId !== photoRequest.current) {
        if (loaded.objectUrl) URL.revokeObjectURL(loaded.objectUrl);
        return;
      }
      if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
      photoUrl.current = loaded.objectUrl;
      setPhoto(loaded);
      setPhotoAdjust(DEFAULT_PHOTO);
      setError(null);
    } catch {
      if (requestId !== photoRequest.current) return;
      setError("That image could not be opened. Please try a different JPG, PNG, or WebP.");
    }
  }

  function updateZoom(zoom: number) {
    if (!photo) return;
    setPhotoAdjust((current) => {
      const frame = photoFrame(photo.element.naturalWidth, photo.element.naturalHeight, {
        ...current,
        zoom,
      });
      return { zoom: frame.zoom, offsetX: frame.offsetX, offsetY: frame.offsetY };
    });
  }

  function updateLegibility(next: Legibility) {
    setLegibility({
      ...next,
      darken: clamp(next.darken, 0, MAX_DARKEN),
    });
  }

  async function download() {
    if (!photo || busy) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await renderPng({
        photo: photo.element,
        photoAdjust,
        logo: logo?.element ?? null,
        logoAdjust,
        legibility,
      });
      downloadBlob(blob, DOWNLOAD_FILENAME);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The picture could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={error ? "app has-error" : "app"}>
      {error && (
        <div className="banner" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <main className="stage">
        <div className="stage-column">
          <header className="masthead">
            <p className="eyebrow">Margate Radio</p>
            <h1>Post Maker</h1>
            <p className="lede">
              Upload a photo and download a 1080 × 1350 picture with the station logo.
            </p>
          </header>
          <Artboard
            photo={photo}
            photoAdjust={photoAdjust}
            logo={logo}
            logoAdjust={logoAdjust}
            legibility={legibility}
            onPhotoAdjust={setPhotoAdjust}
          />
          <p className="size-caption">1080 × 1350</p>
          <p className="drag-hint">Drag to move the photo. The logo stays still.</p>
        </div>
      </main>

      <Controls
        photo={photo}
        photoAdjust={photoAdjust}
        onZoom={updateZoom}
        onResetPhoto={() => setPhotoAdjust(DEFAULT_PHOTO)}
        onUploadPhoto={openPhotoPicker}
        legibility={legibility}
        onLegibility={updateLegibility}
        busy={busy}
        onDownload={() => void download()}
      />

      <input
        ref={photoInputRef}
        className="file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void onPhotoPicked(file);
        }}
      />
    </div>
  );
}
