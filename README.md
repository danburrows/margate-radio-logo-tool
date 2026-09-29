# Margate Radio Template Tool

This branch is not published to GitHub Pages. The live Post Maker is https://danburrows.github.io/margate-radio-logo-tool/

A browser tool for station volunteers. Choose a template, upload a photo, and download a still PNG at 1080 × 1350. Photos are edited only in the browser — nothing is uploaded.

The logo in `images/Logo.svg` loads on its own and stays fixed on the picture.

## Run

```bash
npm install
npm run dev
```

Open the address Vite prints, usually http://localhost:5173.

## Embed

Paste this on another page. The tool fills the frame, and photos still stay in the visitor's browser.

```html
<iframe src="https://danburrows.github.io/margate-radio-logo-tool/?embed=1" title="Margate Radio Post Maker" style="width:100%;height:800px;border:0"></iframe>
```

Add `?embed=1` so the page drops its outer margin and fills the iframe. An iframe without that parameter still switches to the same layout. The tool does not show this snippet to volunteers.

## Production build

```bash
npm run build
npm run preview
```
