"""
Translate Lambda — wraps Amazon Translate for the frontend.
Frontend calls /translate via API Gateway instead of calling Translate directly,
so AWS credentials are never exposed to the browser.
"""
import json
import re

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

# Amazon Translate max bytes per call
MAX_BYTES = 9000


def batch_translate_list(texts, source, target):
    """
    Translate a list of strings using as few Amazon Translate API calls as possible.

    Strings are joined with indexed markers like [[0]], [[1]], ... which are
    pure ASCII digits in brackets — they survive translation in every language.
    We chunk the list if the total byte size would exceed the API limit.
    """
    if not texts:
        return []

    results = [''] * len(texts)
    chunk_indices = []
    chunk_parts = []
    current_bytes = 0

    for i, text in enumerate(texts):
        encoded = text.encode('utf-8') if isinstance(text, str) else str(text).encode('utf-8')
        marker = f'[[{i}]]\n'
        entry_bytes = len(marker.encode()) + len(encoded) + 1  # +1 for newline

        if chunk_parts and current_bytes + entry_bytes > MAX_BYTES:
            # Flush current chunk
            _translate_chunk(chunk_indices, chunk_parts, source, target, results)
            chunk_indices = []
            chunk_parts = []
            current_bytes = 0

        chunk_indices.append(i)
        chunk_parts.append(f'[[{i}]]\n{text}')
        current_bytes += entry_bytes

    if chunk_parts:
        _translate_chunk(chunk_indices, chunk_parts, source, target, results)

    return results


def _translate_chunk(indices, parts, source, target, results):
    joined = '\n'.join(parts)
    translated_joined = translate(joined, source, target)

    # Split on [[N]] markers — brackets and digits always survive translation
    segments = re.split(r'\[\[\d+\]\]\s*\n?', translated_joined)
    # segments[0] is text before the first marker (empty or whitespace), skip it
    values = [s.strip() for s in segments[1:]]

    if len(values) == len(indices):
        for idx, val in zip(indices, values):
            results[idx] = val
    else:
        # Fallback: translate individually if markers were mangled
        for idx, part in zip(indices, parts):
            original_text = part.split('\n', 1)[1] if '\n' in part else part
            results[idx] = translate(original_text, source, target)


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

        if isinstance(texts, list):
            translated = batch_translate_list(texts, source, target)
        else:
            translated = [translate(str(texts), source, target)]

        return {
            **ok({"translated": translated, "source": source, "target": target}),
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"}
        }

    except Exception as e:
        return {**error(str(e), 500), "headers": CORS_HEADERS}
