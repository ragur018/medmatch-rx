import os

import httpx
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware


OCR_SERVICE_URL = os.getenv(
    "OCR_SERVICE_URL",
    "http://127.0.0.1:8001/extract",
)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

app = FastAPI(title="MedMatch Rx API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "MedMatch Rx API is running",
        "ocrEngine": "Qwen Python OCR service",
        "ocrServiceUrl": OCR_SERVICE_URL,
    }


@app.get("/health")
async def health():
    try:
        health_url = OCR_SERVICE_URL.rsplit("/extract", 1)[0] + "/health"

        async with httpx.AsyncClient(
            timeout=httpx.Timeout(5.0, connect=3.0)
        ) as client:
            response = await client.get(health_url)
            response.raise_for_status()
            ocr_health = response.json()

        return {
            "status": "ok",
            "backend": "running",
            "ocrService": ocr_health,
        }

    except (httpx.HTTPError, ValueError):
        raise HTTPException(
            status_code=503,
            detail=(
                "Backend is running, but the Python OCR service "
                "is unavailable. Check that it is running on port 8001."
            ),
        )


@app.post("/api/prescriptions/extract")
async def extract_prescription(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Upload a JPG, PNG, or WEBP image.",
        )

    image_bytes = await file.read(MAX_UPLOAD_BYTES + 1)

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Image must be 10 MB or smaller.",
        )

    filename = os.path.basename(file.filename or "prescription.jpg")

    try:
        timeout = httpx.Timeout(300.0, connect=5.0)

        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                OCR_SERVICE_URL,
                files={
                    "file": (
                        filename,
                        image_bytes,
                        file.content_type,
                    )
                },
            )

    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail=(
                "Cannot connect to the Python OCR service. "
                "Make sure it is running on port 8001."
            ),
        )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail=(
                "OCR processing took too long. "
                "Try again with a smaller or clearer image."
            ),
        )

    except httpx.HTTPError:
        raise HTTPException(
            status_code=502,
            detail="Communication with the Python OCR service failed.",
        )

    if response.status_code != 200:
        try:
            upstream_detail = response.json().get(
                "detail",
                "OCR processing failed.",
            )
        except ValueError:
            upstream_detail = "OCR processing failed."

        raise HTTPException(
            status_code=502,
            detail=f"Python OCR service error: {upstream_detail}",
        )

    try:
        result = response.json()
    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="The Python OCR service returned invalid JSON.",
        )

    extracted_text = result.get("text") or result.get("extractedText") or ""

    if not isinstance(extracted_text, str):
        raise HTTPException(
            status_code=502,
            detail="The OCR service returned an unexpected text format.",
        )

    return {
        "text": extracted_text,
        "extractedText": extracted_text,
        "ocrEngine": result.get(
            "ocrEngine",
            "Qwen2.5-VL-3B (4-bit NF4, local)",
        ),
        "requiresPharmacistReview": True,
        "message": (
            "OCR output is unverified. Check all medicine names, "
            "strengths, doses, frequencies, and durations against "
            "the original prescription. Unclear fields require "
            "human verification."
        ),
    }
