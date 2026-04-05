import os
from dotenv import load_dotenv

load_dotenv()

from groq import Groq
import google.generativeai as genai
import base64

def _ocr_groq(image_path):
    print("Testing groq vision")
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    resp = client.chat.completions.create(
        model="llama-3.2-90b-vision-preview",
        messages=[{
            "role": "user",
            "content": [
                {"type": "image_url",
                 "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                {"type": "text", "text": "Extract all text."}
            ]
        }],
        temperature=0.2,
        max_tokens=2000,
    )
    print("Groq success:", len(resp.choices[0].message.content))

def _ocr_gemini(image_path):
    print("Testing gemini vision")
    from PIL import Image
    genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-1.5-flash") # or gemini-2.0-flash
    img = Image.open(image_path)
    resp = model.generate_content(["Extract all text.", img])
    print("Gemini success:", len(resp.text))

from PIL import Image
img = Image.new('RGB', (600, 100), color = (255, 255, 255))
img.save("dummy2.jpg")

try:
    _ocr_groq("dummy2.jpg")
except Exception as e:
    print(f"Groq Error: {e}")

try:
    _ocr_gemini("dummy2.jpg")
except Exception as e:
    print(f"Gemini Error: {e}")
