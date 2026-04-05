import os
from dotenv import load_dotenv

load_dotenv()

from groq import Groq
import base64

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

from PIL import Image
img = Image.new('RGB', (100, 100), color = (255, 255, 255))
img.save("dummy3.jpg")

with open("dummy3.jpg", "rb") as f:
    b64 = base64.b64encode(f.read()).decode("utf-8")

try:
    resp = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{
            "role": "user",
            "content": [
                {"type": "image_url",
                 "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                {"type": "text", "text": "Extract all text."}
            ]
        }],
        temperature=0.2,
        max_tokens=500
    )
    print("Success")
except Exception as e:
    import json
    if hasattr(e, "response"):
        print("Detailed Error:", e.response.text)
    else:
        print("Error:", e)
