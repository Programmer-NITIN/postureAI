"""
Text-to-Speech API — Neural Regional Voice Generation via Edge-TTS

Generates high-quality MP3 audio from text using Microsoft Edge's neural TTS engine.
Supports all major Indian languages with natural-sounding voices.

Endpoint: GET /api/tts/generate?text=...&voice=hi-IN-SwaraNeural
Returns: audio/mpeg stream
"""

import asyncio
import io
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api/tts", tags=["Text-to-Speech"])

# ── Voice Map: Language Code → Best Neural Voice ────────────────
VOICE_MAP = {
    # Primary Indian Languages
    "en": "en-IN-NeerjaNeural",
    "en-IN": "en-IN-NeerjaNeural",
    "hi": "hi-IN-SwaraNeural",
    "hi-IN": "hi-IN-SwaraNeural",
    "bn": "bn-IN-TanishaaNeural",
    "bn-IN": "bn-IN-TanishaaNeural",
    "te": "te-IN-ShrutiNeural",
    "te-IN": "te-IN-ShrutiNeural",
    "mr": "mr-IN-AarohiNeural",
    "mr-IN": "mr-IN-AarohiNeural",
    "ta": "ta-IN-PallaviNeural",
    "ta-IN": "ta-IN-PallaviNeural",
    "gu": "gu-IN-DhwaniNeural",
    "gu-IN": "gu-IN-DhwaniNeural",
    "kn": "kn-IN-SapnaNeural",
    "kn-IN": "kn-IN-SapnaNeural",
    "ml": "ml-IN-SobhanaNeural",
    "ml-IN": "ml-IN-SobhanaNeural",
    "pa": "pa-IN-GurpreetNeural",
    "pa-IN": "pa-IN-GurpreetNeural",
    "ur": "ur-IN-GulNeural",
    "ur-IN": "ur-IN-GulNeural",

    # Fallback languages (use closest available voice)
    "or": "or-IN-SubhasiniNeural",
    "or-IN": "or-IN-SubhasiniNeural",
    "as": "as-IN-PriyomNeural",
    "as-IN": "as-IN-PriyomNeural",
    "ne": "ne-NP-HemkalaNeural",
    "ne-NP": "ne-NP-HemkalaNeural",

    # Less common — fallback to Hindi Neural
    "mai": "hi-IN-SwaraNeural",
    "sa": "hi-IN-SwaraNeural",
    "sd": "ur-IN-GulNeural",
    "ks": "ur-IN-GulNeural",
    "kok": "hi-IN-SwaraNeural",
    "doi": "hi-IN-SwaraNeural",
    "mni": "bn-IN-TanishaaNeural",
    "sat": "hi-IN-SwaraNeural",
    "bo": "hi-IN-SwaraNeural",
}


async def _generate_tts(text: str, voice: str) -> bytes:
    """Generate MP3 audio bytes using edge-tts."""
    import edge_tts

    communicate = edge_tts.Communicate(text, voice)
    audio_buffer = io.BytesIO()

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_buffer.write(chunk["data"])

    audio_buffer.seek(0)
    return audio_buffer.read()


@router.get("/generate")
async def generate_tts(
    text: str = Query(..., description="Text to synthesize", max_length=500),
    voice: str = Query("en-IN-NeerjaNeural", description="Voice ID or language code"),
    lang: str = Query("en", description="Language code fallback"),
):
    """
    Generate neural TTS audio from text.

    - If `voice` matches a known Edge-TTS voice ID, use it directly.
    - If `voice` is a language code (e.g. 'hi', 'te-IN'), map to best voice.
    - Falls back to `lang` parameter, then English.

    Returns: audio/mpeg streaming response.
    """
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # Resolve voice: try direct voice param, then lang param, then default
    resolved_voice = VOICE_MAP.get(voice, voice)
    if resolved_voice == voice and not voice.endswith("Neural"):
        # It's a language code, not a voice ID
        resolved_voice = VOICE_MAP.get(lang, VOICE_MAP.get("en", "en-IN-NeerjaNeural"))

    try:
        audio_bytes = await _generate_tts(text.strip(), resolved_voice)

        if not audio_bytes:
            raise HTTPException(status_code=500, detail="TTS generation produced no audio")

        return StreamingResponse(
            io.BytesIO(audio_bytes),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=speech.mp3",
                "Cache-Control": "public, max-age=3600",
            },
        )

    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="edge-tts package not installed. Run: pip install edge-tts",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"TTS generation failed: {str(e)}",
        )


@router.get("/voices")
async def list_voices():
    """List all available voice mappings."""
    return {
        "voices": VOICE_MAP,
        "note": "Use language code (e.g. 'hi') or full voice ID (e.g. 'hi-IN-SwaraNeural')",
    }
