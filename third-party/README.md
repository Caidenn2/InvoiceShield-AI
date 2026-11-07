# Third-party source notices

`src/app/wallet.css` adapts the stylesheet from `@solana/wallet-adapter-react-ui` version 0.9.40, published by the Solana Maintainers and maintained at https://github.com/anza-xyz/wallet-adapter.

The original stylesheet is Apache-2.0 licensed. A copy of that license is included in `wallet-adapter-LICENSE.txt`. Changes remove the Google Fonts import and replace the remote font family with local system fonts. Project styling overrides remain in `globals.css`.

This stylesheet remains subject to Apache-2.0; the repository's MIT license applies to original InvoiceShield project code. Other installed dependencies retain their own licenses.

## Local document processing

PDF.js is distributed under Apache-2.0; see pdfjs-LICENSE.txt. Tesseract.js and its recognition core are distributed under Apache-2.0; see tesseract-LICENSE.txt and the installed core package notices. Worker/core files are copied from the locked dependencies during development and builds, not downloaded from a runtime CDN.

The included English recognition data comes from https://tessdata.projectnaptha.com/4.0.0_fast/eng.traineddata.gz, the Tesseract.js fast language-data distribution. Tesseract language data retains its upstream Apache-2.0 terms. File SHA-256: 18c1ac52b75e35d44735fb6c2a60acfaf23033524653200738e98f0243edb75b.

Upstream projects: https://github.com/mozilla/pdf.js, https://github.com/naptha/tesseract.js, https://github.com/naptha/tesseract.js-core, and https://github.com/tesseract-ocr/tessdata_fast.
