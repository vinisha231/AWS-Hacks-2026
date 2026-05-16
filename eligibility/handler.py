import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.connection import execute_one, execute
from eligibility.programs import check_all


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
        session_id = body.get("session_id")
        user_id = body.get("user_id")

        if not session_id or not user_id:
            return {"statusCode": 400, "body": json.dumps({"error": "session_id and user_id are required"})}

        # Load structured intake data from Aurora
        session = execute_one(
            "SELECT structured, language FROM intake_sessions WHERE session_id = %s AND user_id = %s",
            (session_id, user_id)
        )
        if not session:
            return {"statusCode": 404, "body": json.dumps({"error": "Session not found"})}

        structured = session["structured"]
        language = session["language"]

        # Run eligibility checks across all programs
        results = check_all(structured)

        # Persist each result to Aurora
        for r in results:
            execute("""
                INSERT INTO eligibility_results
                    (session_id, user_id, program, eligible, estimated_value)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (session_id, user_id, r["program"], r["eligible"], r["estimated_monthly_value"]))

        eligible_programs = [r for r in results if r["eligible"]]
        total_monthly = sum(r["estimated_monthly_value"] for r in eligible_programs)

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "session_id": session_id,
                "language": language,
                "results": results,
                "eligible_count": len(eligible_programs),
                "total_estimated_monthly_value": total_monthly
            })
        }

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
