import asyncio
import os
import tempfile
import traceback
from contextlib import asynccontextmanager

import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from transformers import (
    AutoProcessor,
    Qwen2_5_VLForConditionalGeneration,
    BitsAndBytesConfig,
)
from qwen_vl_utils import process_vision_info


MODEL_PATH = (
    r"C:\Quantix Hack\Files\medmatch-rx-frontend"
    r"\handwriting-ocr-model"
)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

processor = None
model = None
inference_lock = asyncio.Lock()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global processor, model

    print("Starting MedMatch Rx OCR service...", flush=True)

    if not os.path.isdir(MODEL_PATH):
        raise RuntimeError(f"Model folder not found: {MODEL_PATH}")

    if not torch.cuda.is_available():
        raise RuntimeError("CUDA GPU is not available.")

    print("GPU:", torch.cuda.get_device_name(0), flush=True)
    print("Loading processor...", flush=True)

    processor = AutoProcessor.from_pretrained(
        MODEL_PATH,
        local_files_only=True,
    )

    quantization_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    print("Loading Qwen model in 4-bit mode...", flush=True)

    model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
        MODEL_PATH,
        quantization_config=quantization_config,
        device_map="auto",
        low_cpu_mem_usage=True,
        attn_implementation="eager",
        local_files_only=True,
    )

    model.eval()
    print("OCR model loaded successfully.", flush=True)

    yield

    print("Stopping MedMatch Rx OCR service.", flush=True)


app = FastAPI(
    title="MedMatch Rx OCR Service",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/")
def home():
    return {
        "message": "MedMatch Rx Python OCR service is running",
        "ocrEngine": "Qwen2.5-VL-3B 4-bit NF4",
        "modelLoaded": model is not None,
    }


@app.get("/health")
def health():
    return {
        "status": "ok" if model is not None else "loading",
        "modelLoaded": model is not None,
    }


@app.post("/extract")
async def extract_prescription(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Upload a JPG, PNG, or WEBP image.",
        )

    if model is None or processor is None:
        raise HTTPException(
            status_code=503,
            detail="OCR model is not ready.",
        )

    image_bytes = await file.read(MAX_UPLOAD_BYTES + 1)

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty.",
        )

    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Image must be 10 MB or smaller.",
        )

    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            prefix="medmatch_ocr_",
            suffix=ALLOWED_TYPES[file.content_type],
            delete=False,
        ) as temp_file:
            temp_file.write(image_bytes)
            temp_path = temp_file.name

        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "image": temp_path,
                    },
                    {
                        "type": "text",
                        "text": (
                            "Transcribe the visible text in this "
                            "prescription image as accurately as "
                            "possible. Preserve line breaks and the "
                            "original wording. Do not guess missing "
                            "or illegible medicine names, strengths, "
                            "doses, frequencies, or durations. Mark "
                            "unreadable text as [unclear]. Return "
                            "only the transcription as plain text. "
                            "Do not provide medical advice, infer "
                            "instructions, or recommend medicines."
                        ),
                    },
                ],
            }
        ]

        prompt = processor.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
        )

        image_inputs, video_inputs = process_vision_info(messages)

        inputs = processor(
            text=[prompt],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt",
        )

        inputs = inputs.to(model.device)

        print(
            f"Processing uploaded image: {file.filename or 'unnamed image'}",
            flush=True,
        )

        async with inference_lock:
            with torch.inference_mode():
                output_ids = model.generate(
                    **inputs,
                    max_new_tokens=256,
                    do_sample=False,
                    use_cache=True,
                )

        input_length = inputs["input_ids"].shape[1]
        generated_ids = output_ids[:, input_length:]

        decoded = processor.batch_decode(
            generated_ids,
            skip_special_tokens=True,
            clean_up_tokenization_spaces=False,
        )

        extracted_text = decoded[0].strip()

        print(
            f"OCR completed. Characters returned: {len(extracted_text)}",
            flush=True,
        )

        return {
            "text": extracted_text,
            "extractedText": extracted_text,
            "ocrEngine": "Qwen2.5-VL-3B (4-bit NF4, local)",
            "requiresPharmacistReview": True,
            "message": (
                "OCR output is unverified. A pharmacist must check "
                "all medicine names, strengths, doses, frequencies, "
                "and durations against the original prescription."
            ),
        }

    except HTTPException:
        raise

    except Exception:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=(
                "OCR processing failed. Check the OCR service "
                "terminal for details."
            ),
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass

        if torch.cuda.is_available():
            torch.cuda.empty_cache()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "ocr_service:app",
        host="127.0.0.1",
        port=8001,
        reload=False,
    )
