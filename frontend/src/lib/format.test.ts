import { describe, expect, it } from "vitest";
import { formatBytes, formatPercent } from "./format";
import { iconForFile, isPreviewableImage } from "./fileIcon";

describe("formatBytes", () => {
  it("formats zero", () => {
    expect(formatBytes(0)).toBe("0 B");
  });
  it("formats bytes, KB, MB", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
  });
});

describe("formatPercent", () => {
  it("computes a clamped percentage", () => {
    expect(formatPercent(50, 100)).toBe(50);
    expect(formatPercent(0, 0)).toBe(0);
    expect(formatPercent(200, 100)).toBe(100);
  });
});

describe("fileIcon helpers", () => {
  it("detects previewable images by extension and content type", () => {
    expect(isPreviewableImage(null, "photo.PNG")).toBe(true);
    expect(isPreviewableImage("image/jpeg", "x")).toBe(true);
    expect(isPreviewableImage(null, "notes.txt")).toBe(false);
  });
  it("returns an icon component for any file", () => {
    expect(iconForFile(null, "archive.zip")).toBeTruthy();
  });
});
