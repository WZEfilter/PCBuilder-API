from fastapi import FastAPI, Request
from pydantic import BaseModel
import requests
import json
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENROUTER_KEY = "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"
AFFILIATE_TAG = "pcai06-20"

class BuildRequest(BaseModel):
    budget: int
    use_case: str

@app.post("/generate-build")
async def generate_build(data: BuildRequest):
    prompt = f"""
    You are a PC building expert. Create a list of optimal parts for a PC build under ${data.budget} for {data.use_case} use.
    Return each part as a line in this format:
    Part Type: Part Name - Reason
    E.g., CPU: Ryzen 5 5600 - Good gaming performance for the price
    Only list CPU, GPU, RAM, SSD, Motherboard, PSU, and Case. No prices.
    """

    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "Content-Type": "application/json"
    }
    body = {
        "model": "deepseek/deepseek-r1:free",
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=body)
    reply = response.json()["choices"][0]["message"]["content"]

    builds = []
    for line in reply.strip().split("\n"):
        if ":" in line:
            part_type, rest = line.split(":", 1)
            if " - " in rest:
                name, reason = rest.split(" - ", 1)
                keyword = name.strip()
                tracker_res = requests.get(f"http://localhost:3000/search?query={keyword}")
                try:
                    link = tracker_res.json().get("link", "#")
                    affiliate_link = link + f"?tag={AFFILIATE_TAG}" if link.startswith("https") else "#"
                except:
                    affiliate_link = "#"

                builds.append({
                    "part": part_type.strip(),
                    "name": keyword,
                    "reason": reason.strip(),
                    "affiliate_link": affiliate_link
                })
    return builds
