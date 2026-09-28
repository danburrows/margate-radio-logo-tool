import assert from "node:assert/strict";
import { test } from "node:test";
import { logoFileError, photoFileError } from "./files.ts";

function file(name: string, type: string, bytes = 8): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

test("photos accept jpg, png, and webp, including missing mime types", () => {
  assert.equal(photoFileError(file("beach.jpg", "image/jpeg")), null);
  assert.equal(photoFileError(file("beach.png", "image/png")), null);
  assert.equal(photoFileError(file("beach.webp", "image/webp")), null);
  assert.equal(photoFileError(file("beach.jpg", "")), null);
  assert.equal(photoFileError(file("beach.webp", "application/octet-stream")), null);
});

test("unsupported photos get a specific message", () => {
  assert.match(photoFileError(file("anim.gif", "image/gif")) ?? "", /JPG, PNG, or WebP/);
  assert.match(photoFileError(file("phone.heic", "image/heic")) ?? "", /HEIC/);
  assert.match(photoFileError(file("notes.txt", "text/plain")) ?? "", /JPG, PNG, or WebP/);
  assert.match(photoFileError(file("empty.jpg", "image/jpeg", 0)) ?? "", /empty/);
});

test("logos accept png and svg only", () => {
  assert.equal(logoFileError(file("mark.png", "image/png")), null);
  assert.equal(logoFileError(file("mark.svg", "image/svg+xml")), null);
  assert.equal(logoFileError(file("mark.svg", "")), null);
  assert.match(logoFileError(file("mark.jpg", "image/jpeg")) ?? "", /PNG or SVG/);
  assert.match(logoFileError(file("mark.webp", "image/webp")) ?? "", /PNG or SVG/);
});
