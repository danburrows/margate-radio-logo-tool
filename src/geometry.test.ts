import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ARTBOARD_H,
  ARTBOARD_W,
  LOGO_WIDTH,
  LOGO_X,
  LOGO_Y,
  coversArtboard,
  defaultLogoAdjust,
  logoFrame,
  photoFrame,
} from "./geometry.ts";

test("a cover fit leaves no empty edges", () => {
  for (const size of [
    [400, 300],
    [300, 4000],
    [1080, 1920],
    [4000, 4000],
    [200, 200],
    [5000, 1000],
  ]) {
    for (const zoom of [1, 1.5, 2, 4]) {
      const frame = photoFrame(size[0], size[1], { zoom, offsetX: 0, offsetY: 0 });
      assert.equal(coversArtboard(frame), true, `${size.join("x")} @ ${zoom}`);
    }
  }
});

test("panning cannot reveal the artboard edge", () => {
  const sizes = [
    [2400, 2400],
    [800, 2000],
    [3000, 1000],
  ];
  for (const [w, h] of sizes) {
    for (const zoom of [1, 2, 4]) {
      for (const offset of [-8000, -40, 0, 40, 8000]) {
        const frame = photoFrame(w, h, { zoom, offsetX: offset, offsetY: offset });
        assert.equal(coversArtboard(frame), true);
        assert.equal(frame.zoom, zoom);
      }
    }
  }
});

test("zoom below the cover fit is raised to fill", () => {
  const frame = photoFrame(1000, 1000, { zoom: 0.2, offsetX: 0, offsetY: 0 });
  assert.equal(frame.zoom, 1);
  assert.equal(coversArtboard(frame), true);
});

test("logo keeps its aspect ratio and stays on the artboard", () => {
  const naturalW = 92;
  const naturalH = 82;
  const placed = logoFrame(naturalW, naturalH, { width: 500, x: 10, y: 20 });
  assert.ok(Math.abs(placed.h / placed.w - naturalH / naturalW) < 1e-9);

  const shoved = logoFrame(naturalW, naturalH, { width: 400, x: 9000, y: -500 });
  assert.ok(shoved.x >= 0);
  assert.ok(shoved.y >= 0);
  assert.ok(shoved.x + shoved.w <= ARTBOARD_W + 1e-6);
  assert.ok(shoved.y + shoved.h <= ARTBOARD_H + 1e-6);
});

test("the logo is fixed to the bottom-right reference", () => {
  const adjust = defaultLogoAdjust(92, 82);
  const frame = logoFrame(92, 82, adjust);
  assert.ok(Math.abs(frame.w - LOGO_WIDTH) < 1e-6);
  assert.ok(Math.abs(frame.h / frame.w - 82 / 92) < 1e-9);
  assert.ok(Math.abs(frame.x - LOGO_X) < 1e-6);
  assert.ok(Math.abs(frame.y - LOGO_Y) < 1e-6);
  assert.ok(Math.abs(ARTBOARD_W - (frame.x + frame.w) - 80) < 1e-6);
});

