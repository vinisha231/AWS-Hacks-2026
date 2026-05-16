"""
API route definitions for Benefits Navigator.

POST /intake                        — submit conversational message, get structured data + session_id
POST /eligibility                   — run cross-program eligibility check for a session
POST /application/create            — create a draft application with auto-filled form data
POST /application/submit            — submit an application, schedule renewal reminder
POST /application/upload            — upload a supporting document to S3
GET  /application/status            — get application status + linked documents
"""

ROUTES = [
    {
        "method": "POST",
        "path": "/intake",
        "handler": "intake.handler.lambda_handler",
        "description": "Conversational intake — free text to structured eligibility data",
        "body": {
            "user_id": "string (UUID)",
            "message": "string (natural language)",
            "language": "string (BCP-47, e.g. 'en', 'es', 'ht', 'vi') — optional, default 'en'"
        }
    },
    {
        "method": "POST",
        "path": "/eligibility",
        "handler": "eligibility.handler.lambda_handler",
        "description": "Run eligibility checks across all 7 programs, ranked by dollar value",
        "body": {
            "user_id": "string (UUID)",
            "session_id": "string (UUID from /intake)"
        }
    },
    {
        "method": "POST",
        "path": "/application/create",
        "handler": "application.handler.lambda_handler",
        "description": "Create a draft application with auto-filled form fields",
        "body": {
            "user_id": "string (UUID)",
            "session_id": "string (UUID)",
            "program": "string (SNAP | Medicaid | CHIP | LIHEAP | WIC | TANF | Section 8)"
        }
    },
    {
        "method": "POST",
        "path": "/application/submit",
        "handler": "application.handler.lambda_handler",
        "description": "Submit application and schedule 30-day renewal reminder via SNS",
        "body": {
            "user_id": "string (UUID)",
            "application_id": "string (UUID)"
        }
    },
    {
        "method": "POST",
        "path": "/application/upload",
        "handler": "application.handler.lambda_handler",
        "description": "Upload document to S3 and link to application",
        "body": {
            "user_id": "string (UUID)",
            "application_id": "string (UUID)",
            "file_b64": "string (base64-encoded file content)",
            "file_name": "string",
            "doc_type": "pay_stub | government_id | lease_agreement | tax_return | utility_bill | other"
        }
    },
    {
        "method": "GET",
        "path": "/application/status",
        "handler": "application.handler.lambda_handler",
        "description": "Get application status and linked documents",
        "query": {
            "user_id": "string (UUID)",
            "application_id": "string (UUID)"
        }
    },
]
