import os
import uuid
import boto3

from db.connection import execute_one, execute

_s3 = None


def _get_s3():
    global _s3
    if _s3 is None:
        _s3 = boto3.client("s3", region_name=os.environ.get("AWS_REGION", "us-east-1"))
    return _s3


BUCKET = os.environ.get("S3_BUCKET", "benefits-navigator-documents")

ALLOWED_TYPES = {"pay_stub", "government_id", "lease_agreement", "tax_return", "utility_bill", "other"}


def upload(user_id: str, application_id: str, file_bytes: bytes, file_name: str, doc_type: str) -> dict:
    if doc_type not in ALLOWED_TYPES:
        raise ValueError(f"doc_type must be one of: {', '.join(ALLOWED_TYPES)}")

    ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "bin"
    s3_key = f"users/{user_id}/applications/{application_id}/{doc_type}_{uuid.uuid4().hex}.{ext}"

    _get_s3().put_object(
        Bucket=BUCKET,
        Key=s3_key,
        Body=file_bytes,
        ServerSideEncryption="AES256",
        Metadata={
            "user_id": user_id,
            "application_id": application_id,
            "doc_type": doc_type,
        }
    )

    row = execute_one("""
        INSERT INTO documents (application_id, user_id, s3_key, doc_type, file_name)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING document_id
    """, (application_id, user_id, s3_key, doc_type, file_name))

    return {"document_id": str(row["document_id"]), "s3_key": s3_key}


def list_documents(application_id: str, user_id: str) -> list:
    rows = execute("""
        SELECT document_id, doc_type, file_name, uploaded_at
        FROM documents
        WHERE application_id = %s AND user_id = %s
        ORDER BY uploaded_at DESC
    """, (application_id, user_id), fetch=True)
    return [dict(r) for r in rows]


def delete(document_id: str, user_id: str) -> bool:
    row = execute_one(
        "SELECT s3_key FROM documents WHERE document_id = %s AND user_id = %s",
        (document_id, user_id)
    )
    if not row:
        return False

    _get_s3().delete_object(Bucket=BUCKET, Key=row["s3_key"])
    execute("DELETE FROM documents WHERE document_id = %s AND user_id = %s", (document_id, user_id))
    return True
