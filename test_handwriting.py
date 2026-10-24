import os
import torch
from transformers import AutoProcessor, Qwen2_5_VLForConditionalGeneration

MODEL_PATH = "./handwriting-ocr-model"

print("========================================")
print("MedMatch Rx Handwriting OCR Test")
print("========================================")

print("PyTorch:", torch.__version__)
print("CUDA available:", torch.cuda.is_available())

if not torch.cuda.is_available():
    raise RuntimeError("CUDA is not available.")

print("GPU:", torch.cuda.get_device_name(0))
print(
    "GPU memory:",
    round(torch.cuda.get_device_properties(0).total_memory / 1024**3, 2),
    "GB"
)

# --------------------------------------------------
# Transformers expects preprocessor_config.json.
# This model provides processor_config.json.
# Create the expected filename if necessary.
# --------------------------------------------------

processor_file = os.path.join(
    MODEL_PATH,
    "processor_config.json"
)

preprocessor_file = os.path.join(
    MODEL_PATH,
    "preprocessor_config.json"
)

if os.path.exists(processor_file) and not os.path.exists(preprocessor_file):
    with open(processor_file, "r", encoding="utf-8") as src:
        data = src.read()

    with open(preprocessor_file, "w", encoding="utf-8") as dst:
        dst.write(data)

    print("Created preprocessor_config.json")

print("\nLoading processor...")

processor = AutoProcessor.from_pretrained(
    MODEL_PATH
)

print("Processor loaded successfully.")

print("\nLoading model...")

model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
    MODEL_PATH,
    torch_dtype=torch.float16,
    device_map="auto",
    low_cpu_mem_usage=True
)

print("\n========================================")
print("MODEL LOADED SUCCESSFULLY")
print("========================================")

print("Model device:", model.device)