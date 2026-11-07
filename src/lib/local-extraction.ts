"use client";
import { parseInvoiceText } from "./local-parser";
export async function extractLocally(
  file: File,
  onProgress: (message: string) => void,
) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPDF = String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  const isPNG = [137, 80, 78, 71, 13, 10, 26, 10].every(
    (b, i) => bytes[i] === b,
  );
  const isJPEG = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!(
    (file.type === "application/pdf" && isPDF) ||
    (file.type === "image/png" && isPNG) ||
    (file.type === "image/jpeg" && isJPEG)
  ))
    throw new Error("File contents do not match a PDF, PNG, or JPG.");
  let text = "",
    method: "pdf-text" | "local-ocr" = "local-ocr";
  if (isPDF) {
    onProgress("Reading PDF text on this device…");
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = "/workers/pdf.worker.min.mjs";
    const doc = await pdfjs.getDocument({
      data: bytes,
      useSystemFonts: true,
    }).promise;
    try {
      if (doc.numPages > 5)
        throw new Error(
          "For this demo, upload an invoice with at most 5 pages.",
        );
      for (let n = 1; n <= doc.numPages; n++) {
        const page = await doc.getPage(n),
          content = await page.getTextContent();
        let pageText = "";
        for (const item of content.items) {
          if ("str" in item) pageText += item.str + (item.hasEOL ? "\n" : " ");
        }
        if (pageText.trim().length > 40) {
          text += pageText + "\n";
          method = "pdf-text";
        } else {
          const viewport = page.getViewport({ scale: 1.6 });
          if (viewport.width * viewport.height > 12000000)
            throw new Error(
              "PDF page is too large. Export a smaller image and retry.",
            );
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({
            canvas,
            canvasContext: canvas.getContext("2d")!,
            viewport,
          }).promise;
          text += (await recognize(canvas, onProgress)) + "\n";
          method = "local-ocr";
        }
      }
    } finally {
      await doc.destroy();
    }
  } else {
    text = await recognize(file, onProgress);
  }
  if (text.trim().length < 10)
    throw new Error(
      "No readable text found. Use a clearer document or enter details manually.",
    );
  text = text.slice(0, 20000);
  return { invoice: parseInvoiceText(text), text, method };
}
async function recognize(
  image: File | HTMLCanvasElement,
  onProgress: (message: string) => void,
) {
  onProgress("Loading free local OCR…");
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr/core",
    langPath: "/ocr",
    workerBlobURL: false,
    logger: (m) => {
      if (m.status === "recognizing text")
        onProgress(
          `Reading text on this device… ${Math.round(m.progress * 100)}%`,
        );
    },
  });
  try {
    const result = await worker.recognize(image);
    return result.data.text;
  } finally {
    await worker.terminate();
  }
}
