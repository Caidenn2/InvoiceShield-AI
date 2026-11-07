const fs = require("node:fs");
const path = require("node:path");
const copy = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
};
const pdfRoot = path.dirname(require.resolve("pdfjs-dist/package.json"));
copy(
  path.join(pdfRoot, "legacy/build/pdf.worker.min.mjs"),
  "public/workers/pdf.worker.min.mjs",
);
const ocrRoot = path.dirname(require.resolve("tesseract.js/package.json"));
copy(path.join(ocrRoot, "dist/worker.min.js"), "public/ocr/worker.min.js");
const coreRoot = path.dirname(
  require.resolve("tesseract.js-core/package.json", { paths: [ocrRoot] }),
);
for (const name of fs
  .readdirSync(coreRoot)
  .filter((n) => /\.wasm(?:\.js)?$/.test(n)))
  copy(path.join(coreRoot, name), path.join("public/ocr/core", name));
console.log("Prepared self-hosted PDF and OCR workers.");
