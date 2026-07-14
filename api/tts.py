import asyncio
import json
import os
from http.server import BaseHTTPRequestHandler

import edge_tts


async def synthesize(text: str) -> bytes:
    communicate = edge_tts.Communicate(
        text,
        os.getenv("EDGE_TTS_VOICE", "zh-CN-YunjianNeural"),
        rate=os.getenv("EDGE_TTS_RATE", "-18%"),
        volume=os.getenv("EDGE_TTS_VOLUME", "+0%"),
        pitch=os.getenv("EDGE_TTS_PITCH", "-10Hz"),
    )
    chunks = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            chunks.append(chunk["data"])
    if not chunks:
        raise RuntimeError("No audio data returned")
    return b"".join(chunks)


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(content_length) or b"{}")
            text = str(payload.get("text", "")).strip()
            if not text:
                self.send_json(400, {"error": "Missing text"})
                return
            if len(text) > 1000:
                self.send_json(400, {"error": "Text is too long"})
                return

            audio = asyncio.run(synthesize(text))
            self.send_response(200)
            self.send_header("Content-Type", "audio/mpeg")
            self.send_header("Cache-Control", "no-store")
            self.send_header(
                "X-TTS-Voice",
                os.getenv("EDGE_TTS_VOICE", "zh-CN-YunjianNeural"),
            )
            self.send_header("Content-Length", str(len(audio)))
            self.end_headers()
            self.wfile.write(audio)
        except Exception as exc:
            self.send_json(500, {"error": f"TTS failed: {exc}"})

    def send_json(self, status: int, payload: dict):
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)
