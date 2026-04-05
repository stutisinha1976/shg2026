import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
try:
    resp = client.chat.completions.create(
        model="llama-3.2-90b-vision-preview",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": "What is 1+1?"}
            ]
        }],
        max_tokens=10
    )
    print("Success:", resp.choices[0].message.content)
except Exception as e:
    print("Error:", e)
