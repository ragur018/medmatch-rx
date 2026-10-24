
import torch
from transformers import AutoProcessor, Qwen2_5_VLForConditionalGeneration
from qwen_vl_utils import process_vision_info

MODEL_PATH = "./handwriting-ocr-model"
IMAGES = ["medicine1.jpeg", "medicine2.jpeg", "medicine3.jpeg"]

print("Loading processor...")
processor = AutoProcessor.from_pretrained(MODEL_PATH)

print("Loading model...")
model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
    MODEL_PATH,
    torch_dtype=torch.float16,
    device_map="auto",
    low_cpu_mem_usage=True
)
model.eval()

for image_path in IMAGES:
    print(f"\n{'=' * 50}")
    print(f"Testing: {image_path}")

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image", "image": image_path},
                {
                    "type": "text",
                    "text": (
                        "Read this prescription image carefully. "
                        "Transcribe only what is visible. Preserve uncertain "
                        "words as [unclear]. Do not guess missing drug names, "
                        "strengths, doses, frequency, or duration."
                    ),
                },
            ],
        }
    ]

    prompt = processor.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    image_inputs, video_inputs = process_vision_info(messages)

    inputs = processor(
        text=[prompt],
        images=image_inputs,
        videos=video_inputs,
        padding=True,
        return_tensors="pt",
    ).to(model.device)

    with torch.inference_mode():
        output_ids = model.generate(**inputs, max_new_tokens=300)

    new_ids = [
        out[len(inp):]
        for inp, out in zip(inputs.input_ids, output_ids)
    ]
    result = processor.batch_decode(
        new_ids, skip_special_tokens=True,
        clean_up_tokenization_spaces=False
    )[0]

    print(result)

print("\nFinished testing all images.")
