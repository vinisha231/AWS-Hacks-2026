"""
Translate Lambda — wraps Amazon Translate for the frontend.
Frontend calls /translate via API Gateway instead of calling Translate directly,
so AWS credentials are never exposed to the browser.
"""
import json

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
    "mr": "Marathi", "mn": "Mongolian", "no": "Norwegian",
    "ps": "Pashto", "pl": "Polish", "pt": "Portuguese (Brazil)",
    "pt-PT": "Portuguese (Portugal)", "pa": "Punjabi", "ro": "Romanian",
    "ru": "Russian", "sr": "Serbian", "si": "Sinhala", "sk": "Slovak",
    "sl": "Slovenian", "so": "Somali", "es": "Spanish",
    "es-MX": "Spanish (Mexico)", "sw": "Swahili", "sv": "Swedish",
    "ta": "Tamil", "te": "Telugu", "th": "Thai", "tr": "Turkish",
    "uk": "Ukrainian", "ur": "Urdu", "uz": "Uzbek", "vi": "Vietnamese",
    "cy": "Welsh"
}

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-api-key"
}


def lambda_handler(event, context):
    method = event.get("httpMethod", "POST")
    path = event.get("path", "")

    # Handle CORS preflight
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    # GET /translate/languages
    if method == "GET" and "languages" in path:
        return {**ok({"languages": SUPPORTED_LANGUAGES}), "headers": {**CORS_HEADERS, "Content-Type": "application/json"}}

    # POST /translate
    try:
        raw_body = event.get("body") or "{}"
        body = json.loads(raw_body)
        texts = body.get("texts") or body.get("text")
        source = body.get("source", "en")
        target = body.get("target", "en")

        if not texts:
            return {**error("texts is required"), "headers": CORS_HEADERS}

        if target not in SUPPORTED_LANGUAGES:
            return {**error(f"Unsupported target language: {target}"), "headers": CORS_HEADERS}

        # Accept single string or array — always return array for consistency
        if isinstance(texts, list):
            translated = [translate(t, source, target) for t in texts]
        else:
            translated = [translate(texts, source, target)]

        return {
            **ok({"translated": translated, "source": source, "target": target}),
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"}
        }

    except Exception as e:
        return {**error(str(e), 500), "headers": CORS_HEADERS}
