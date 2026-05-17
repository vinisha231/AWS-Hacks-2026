import json
import boto3

_client = None

MODEL_ID = "us.anthropic.claude-haiku-4-5-20251001-v1:0"


def _get_client():
    global _client
    if _client is None:
        _client = boto3.client("bedrock-runtime", region_name="us-east-1")
    return _client


def invoke(system_prompt: str, user_message: str, max_tokens: int = 1024) -> str:
    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_message}]
    })
    response = _get_client().invoke_model(modelId=MODEL_ID, body=body)
    result = json.loads(response["body"].read())
    return result["content"][0]["text"]


def invoke_json(system_prompt: str, user_message: str, max_tokens: int = 1024) -> dict:
    raw = invoke(system_prompt, user_message, max_tokens)
    return json.loads(raw)
