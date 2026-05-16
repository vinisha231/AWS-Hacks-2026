import json


from db.connection import execute_one
from utils.translate import to_english, from_english
from utils.bedrock import invoke_json

INTAKE_SYSTEM_PROMPT = """
You are a benefits eligibility assistant helping underserved individuals in the US.
Extract the following from the user's message and return ONLY valid JSON with these exact fields:
{
  "household_size": <integer or null>,
  "monthly_income": <integer in dollars or null>,
  "state": <2-letter state code or null>,
  "employment_status": <"employed"|"unemployed"|"part-time"|"self-employed"|"unknown">,
  "has_children": <boolean or null>,
  "num_children": <integer or null>,
  "has_disability": <boolean or null>,
  "is_veteran": <boolean or null>,
  "housing_situation": <"renting"|"owning"|"homeless"|"other"|"unknown">,
  "is_pregnant": <boolean or null>,
  "age": <integer or null>
}

If a field cannot be determined, use null. Do not explain — return only the JSON object.
"""


def _build_confirmation(structured: dict, language: str) -> str:
    programs_hint = []
    if structured.get("monthly_income") is not None:
        programs_hint.append("SNAP")
    if structured.get("has_children") or structured.get("num_children"):
        programs_hint.append("WIC")
    if structured.get("housing_situation") == "renting":
        programs_hint.append("housing assistance")

    hint = ", ".join(programs_hint) if programs_hint else "several programs"
    msg = f"Got it! Checking your eligibility for {hint} and more."
    return from_english(msg, language)


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
        user_id = body.get("user_id")
        user_message = body.get("message", "").strip()
        language = body.get("language", "en")

        if not user_id or not user_message:
            return {"statusCode": 400, "body": json.dumps({"error": "user_id and message are required"})}

        # Translate user input to English for model processing
        english_message = to_english(user_message, language)

        # Extract structured data via Bedrock
        structured = invoke_json(INTAKE_SYSTEM_PROMPT, english_message)

        # Persist session
        row = execute_one("""
            INSERT INTO intake_sessions (user_id, raw_input, structured, language)
            VALUES (%s, %s, %s, %s)
            RETURNING session_id
        """, (user_id, user_message, json.dumps(structured), language))

        session_id = str(row["session_id"])
        confirmation = _build_confirmation(structured, language)

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "session_id": session_id,
                "structured": structured,
                "message": confirmation
            })
        }

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
