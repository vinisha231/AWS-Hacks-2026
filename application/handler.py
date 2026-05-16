import json
import base64
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import boto3
from db.connection import execute_one, execute
from application.autofill import autofill
from application.documents import upload, list_documents, delete

sns = boto3.client("sns", region_name=os.environ.get("AWS_REGION", "us-east-1"))
SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN", "")


def _schedule_renewal(application_id: str, user_id: str, days: int = 330):
    remind_at = datetime.utcnow() + timedelta(days=days)
    execute("""
        INSERT INTO renewal_reminders (application_id, user_id, remind_at)
        VALUES (%s, %s, %s)
    """, (application_id, user_id, remind_at))


def _send_sns_reminder(user_id: str, program: str, application_id: str):
    if not SNS_TOPIC_ARN:
        return
    sns.publish(
        TopicArn=SNS_TOPIC_ARN,
        Message=json.dumps({
            "type": "renewal_reminder",
            "user_id": user_id,
            "program": program,
            "application_id": application_id
        }),
        Subject=f"Benefits renewal reminder — {program}"
    )


def _create(body: dict) -> dict:
    session_id = body.get("session_id")
    user_id = body.get("user_id")
    program = body.get("program")

    if not all([session_id, user_id, program]):
        return {"statusCode": 400, "body": json.dumps({"error": "session_id, user_id, program required"})}

    session = execute_one(
        "SELECT structured FROM intake_sessions WHERE session_id = %s AND user_id = %s",
        (session_id, user_id)
    )
    if not session:
        return {"statusCode": 404, "body": json.dumps({"error": "Session not found"})}

    form_data = autofill(program, session["structured"])

    row = execute_one("""
        INSERT INTO applications (user_id, session_id, program, status, form_data)
        VALUES (%s, %s, %s, 'draft', %s)
        RETURNING application_id
    """, (user_id, session_id, program, json.dumps(form_data)))

    return {
        "statusCode": 201,
        "body": json.dumps({
            "application_id": str(row["application_id"]),
            "program": program,
            "form_data": form_data,
            "status": "draft"
        })
    }


def _submit(body: dict) -> dict:
    application_id = body.get("application_id")
    user_id = body.get("user_id")

    if not application_id or not user_id:
        return {"statusCode": 400, "body": json.dumps({"error": "application_id and user_id required"})}

    row = execute_one("""
        UPDATE applications
        SET status = 'submitted', submitted_at = NOW(), updated_at = NOW()
        WHERE application_id = %s AND user_id = %s
        RETURNING program
    """, (application_id, user_id))

    if not row:
        return {"statusCode": 404, "body": json.dumps({"error": "Application not found"})}

    _schedule_renewal(application_id, user_id)
    _send_sns_reminder(user_id, row["program"], application_id)

    return {
        "statusCode": 200,
        "body": json.dumps({"application_id": application_id, "status": "submitted"})
    }


def _upload_doc(body: dict, file_bytes: bytes) -> dict:
    return {
        "statusCode": 201,
        "body": json.dumps(upload(
            user_id=body["user_id"],
            application_id=body["application_id"],
            file_bytes=file_bytes,
            file_name=body.get("file_name", "document"),
            doc_type=body.get("doc_type", "other")
        ))
    }


def _get_status(user_id: str, application_id: str) -> dict:
    row = execute_one("""
        SELECT application_id, program, status, form_data, submitted_at, updated_at
        FROM applications
        WHERE application_id = %s AND user_id = %s
    """, (application_id, user_id))

    if not row:
        return {"statusCode": 404, "body": json.dumps({"error": "Application not found"})}

    docs = list_documents(application_id, user_id)
    result = dict(row)
    result["application_id"] = str(result["application_id"])
    result["documents"] = docs
    for k in ("submitted_at", "updated_at"):
        if result[k]:
            result[k] = result[k].isoformat()

    return {"statusCode": 200, "body": json.dumps(result)}


def lambda_handler(event, context):
    try:
        action = event.get("pathParameters", {}).get("action", "")
        body = json.loads(event.get("body", "{}"))
        params = event.get("queryStringParameters") or {}

        if action == "create":
            return _create(body)

        if action == "submit":
            return _submit(body)

        if action == "upload":
            file_bytes = base64.b64decode(body.get("file_b64", ""))
            return _upload_doc(body, file_bytes)

        if action == "status":
            return _get_status(params.get("user_id"), params.get("application_id"))

        return {"statusCode": 400, "body": json.dumps({"error": f"Unknown action: {action}"})}

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
