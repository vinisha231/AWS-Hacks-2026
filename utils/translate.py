import boto3

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = boto3.client("translate", region_name="us-east-1")
    return _client


def to_english(text: str, source_language: str) -> str:
    if source_language == "en":
        return text
    response = _get_client().translate_text(
        Text=text,
        SourceLanguageCode=source_language,
        TargetLanguageCode="en"
    )
    return response["TranslatedText"]


def from_english(text: str, target_language: str) -> str:
    if target_language == "en":
        return text
    response = _get_client().translate_text(
        Text=text,
        SourceLanguageCode="en",
        TargetLanguageCode=target_language
    )
    return response["TranslatedText"]


def translate(text: str, source: str, target: str) -> str:
    if source == target:
        return text
    response = _get_client().translate_text(
        Text=text,
        SourceLanguageCode=source,
        TargetLanguageCode=target
    )
    return response["TranslatedText"]
