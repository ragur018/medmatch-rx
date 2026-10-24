# MedMatch Rx — Frontend Prototype

A responsive React/Vite hackathon frontend for **PS06 – MedMatch Rx: Prescription Reading Assistant**.

## Run locally

1. Install Node.js (Node 20.19+ or 22.12+ recommended).
2. Extract this project folder.
3. Open a terminal inside `medmatch-rx-frontend`.
4. Run:

   ```bash
   npm install
   npm run dev
   ```

5. Open the local URL printed by Vite, usually `http://localhost:5173`.

## What is included

- Responsive pharmacist review workspace with sidebar navigation.
- Prescription image preview and local image selection (JPG, PNG, WEBP; maximum 12 MB).
- Structured editable fields for medicine name, strength, dose, frequency, and duration.
- Per-field extraction confidence indicators.
- Example look-alike / sound-alike (LASA) warning for the demo names Hydroxyzine and Hydralazine.
- Review checklist that blocks confirmation until all fields are complete, each line is marked reviewed, and every name warning is acknowledged.
- Final pharmacist confirmation modal and a session-only demo audit trail.
- Review queue and drug-safety information screens.

## Important prototype limitation

**This frontend does not perform OCR or verify medicines.** The initial prescription and extracted values are fictional sample data. Selecting your own image only previews that image in the browser; pressing **Simulate extraction** inserts the fixed sample data and clearly identifies it as simulated. Nothing is sent to a server by this frontend.

Before real or clinical use, connect a suitable OCR/handwriting-recognition service and a trusted, versioned medication catalogue/LASA reference; validate confidence calibration; secure any patient data; and implement server-side authorization, audit logging, and safety review. A confidence score is not proof that a medicine has been read correctly, and this prototype must not be used for dispensing decisions.

## Main files

- `src/App.jsx` — React screens, interactions, review gate, upload preview, and mock data.
- `src/index.css` — responsive UI styles.
- `public/sample-prescription.svg` — synthetic prescription artwork for the demo.
- `index.html` — Vite app entry point.
