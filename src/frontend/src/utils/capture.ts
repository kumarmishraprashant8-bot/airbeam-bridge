// frontend/src/utils/capture.ts
export function captureViewerScreenshotBase64(): string {
  const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
  if (!canvas) return "";
  return canvas.toDataURL("image/png"); // returns 'data:image/png;base64,...'
}
