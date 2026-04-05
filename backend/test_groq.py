import os
from shg_apex import HybridOCREngine
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
engine = HybridOCREngine(None, client)

# Create a small dummy image
from PIL import Image
img = Image.new('RGB', (600, 100), color = (255, 255, 255))
import cv2
import numpy as np
img_cv = np.array(img)
cv2.putText(img_cv, "Rupali | Loan | 5000 | 2026-04-05", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
Image.fromarray(img_cv).save("dummy.jpg")

text, conf = engine.ocr_groq_vision("dummy.jpg")
print(f"Result: {text}")
print(f"Conf: {conf}")
