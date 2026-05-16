"""
SMS Fallback Lambda — receives incoming SMS via Amazon Pinpoint → SNS,
runs the full eligibility flow over text message.

Flow:
  User texts number → Pinpoint → SNS → this Lambda → eligibility check → SMS reply
"""
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import boto3
from sms.session import get_or_create, current_question, save_answer, STEPS
from eligibility.programs import check_all

pinpoint = boto3.client("pinpoint", region_name=os.environ.get("AWS_REGION", "us-east-1"))
APP_ID = os.environ.get("PINPOINT_APP_ID", "")


def send_sms(phone: str, message: str):
    pinpoint.send_messages(
        ApplicationId=APP_ID,
        MessageRequest={
            "Addresses": {phone: {"ChannelType": "SMS"}},
            "MessageConfiguration": {
                "SMSMessage": {
                    "Body": message,
                    "MessageType": "TRANSACTIONAL",
                    "SenderId": "Compass"
                }
            }
        }
    )


def format_results(results: list) -> str:
    eligible = [r for r in results if r["eligible"]]
    if not eligible:
        return "Based on your answers, we could not find programs you qualify for right now. Text RESTART to try again."

    total = sum(r["estimated_monthly_value"] for r in eligible)
    lines = [f"You may qualify for {len(eligible)} program(s) worth ~${total}/month:\n"]
    for r in eligible:
        lines.append(f"- {r['program']}: ~${r['estimated_monthly_value']}/mo")
    lines.append("\nVisit compass.app to apply and upload documents.")
    return "\n".join(lines)


def lambda_handler(event, context):
    try:
        # SNS wraps the Pinpoint event
        for record in event.get("Records", []):
            message = json.loads(record["Sns"]["Message"])
            phone = message.get("originationNumber", "")
            body = message.get("messageBody", "").strip()

            if not phone:
                continue

            # Allow restart
            if body.upper() in ("RESTART", "RESET", "START OVER"):
                from db.connection import execute
                execute("UPDATE sms_sessions SET completed = TRUE WHERE phone = %s", (phone,))
                session = get_or_create(phone)
                send_sms(phone, current_question(session))
                continue

            session = get_or_create(phone)

            if session["completed"]:
                send_sms(phone, "Your session is complete. Text RESTART to check again.")
                continue

            # Save the user's answer
            session = save_answer(session, body)

            if session["completed"]:
                # Run eligibility and send results
                send_sms(phone, "Checking your eligibility...")
                answers = session["answers"] if isinstance(session["answers"], dict) else json.loads(session["answers"])
                results = check_all(answers)
                send_sms(phone, format_results(results))
            else:
                # Ask next question
                send_sms(phone, current_question(session))

    except Exception as e:
        print(f"SMS handler error: {e}")

    return {"statusCode": 200}
