"""
Translate Lambda — wraps Amazon Translate for the frontend.
Frontend calls /translate via API Gateway instead of calling Translate directly,
so AWS credentials are never exposed to the browser.
"""
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.translate import translate
from utils.response import ok, error

SUPPORTED_LANGUAGES = {
    "af": "Afrikaans", "sq": "Albanian", "am": "Amharic", "ar": "Arabic",
    "az": "Azerbaijani", "bn": "Bengali", "bs": "Bosnian", "bg": "Bulgarian",
    "ca": "Catalan", "zh": "Chinese (Simplified)", "hr": "Croatian", "cs": "Czech",
    "da": "Danish", "fa-AF": "Dari", "nl": "Dutch", "en": "English",
    "et": "Estonian", "fa": "Farsi (Persian)", "tl": "Filipino (Tagalog)",
    "fi": "Finnish", "fr": "French", "fr-CA": "French (Canada)", "ka": "Georgian",
    "de": "German", "el": "Greek", "gu": "Gujarati", "ht": "Haitian Creole",
    "ha": "Hausa", "he": "Hebrew", "hi": "Hindi", "hu": "Hungarian",
    "id": "Indonesian", "it": "Italian", "ja": "Japanese", "kn": "Kannada",
    "kk": "Kazakh", "ko": "Korean", "lv": "Latvian", "lt": "Lithuanian",
    "mk": "Macedonian", "ms": "Malay", "ml": "Malayalam", "mt": "Maltese",
    "mr": "Marathi", "mn": "Mongolian", "no": "Norwegian (Bokmål)",
    "ps": "Pashto", "pl": "Polish", "pt": "Portuguese (Brazil)",
    "pt-PT": "Portuguese (Portugal)", "pa": "Punjabi", "ro": "Romanian",
    "ru": "Russian", "sr": "Serbian", "si": "Sinhala", "sk": "Slovak",
    "sl": "Slovenian", "so": "Somali", "es": "Spanish",
    "es-MX": "Spanish (Mexico)", "sw": "Swahili", "sv": "Swedish",
    "ta": "Tamil", "te": "Telugu", "th": "Thai", "tr": "Turkish",
    "uk": "Ukrainian", "ur": "Urdu", "uz": "Uzbek", "vi": "Vietnamese",
    "cy": "Welsh"
}


def lambda_handler(event, context):
    try:
        path = event.get("path", "")

        # GET /translate/languages — return supported language list
        if event.get("httpMethod") == "GET" and "languages" in path:
            return ok({"languages": SUPPORTED_LANGUAGES})

        body = json.loads(event.get("body", "{}"))
        text = body.get("text", "").strip()
        source = body.get("source", "en")
        target = body.get("target", "en")

        if not text:
            return error("text is required")

        if target not in SUPPORTED_LANGUAGES:
            return error(f"Unsupported target language: {target}")

        # Translate single string or list of strings
        if isinstance(text, list):
            translated = [translate(t, source, target) for t in text]
        else:
            translated = translate(text, source, target)

        return ok({"translated": translated, "source": source, "target": target})

    except Exception as e:
        return error(str(e), 500)
