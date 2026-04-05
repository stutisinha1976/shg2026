import os
from dotenv import load_dotenv

load_dotenv()

from shg_apex import HybridOCREngine
from groq import Groq
import google.generativeai as genai

print("GEMINI_KEY:", os.environ.get("GEMINI_API_KEY", "")[:5] + "...")
print("GROQ_KEY:", os.environ.get("GROQ_API_KEY", "")[:5] + "...")

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-2.0-flash")

engine = HybridOCREngine(gemini_model, client)

# Create a small dummy image
from PIL import Image
import cv2
import numpy as np
img = Image.new('RGB', (600, 100), color = (255, 255, 255))
img_cv = np.array(img)
cv2.putText(img_cv, "Rupali | Loan | 5000 | 2026-04-05", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
Image.fromarray(img_cv).save("dummy.jpg")

print("\n--- Testing Groq ---")
try:
    text, conf = engine.ocr_groq_vision("dummy.jpg")
    print(f"Result length: {len(text)}. Conf: {conf}")
except Exception as e:
    print(f"TEST SCRIPT EXCEPTION: {e}")

print("\n--- Testing Gemini ---")
try:
    text, conf = engine.ocr_gemini("dummy.jpg")
    print(f"Result length: {len(text)}. Conf: {conf}")
except Exception as e:
    print(f"TEST SCRIPT EXCEPTION: {e}")

res = engine.extract("dummy.jpg")
print("\n--- Extract Result ---")
print(res)
