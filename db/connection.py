import os
import psycopg2
from psycopg2.extras import RealDictCursor


def get_db():
    return psycopg2.connect(
        host=os.environ["AURORA_HOST"],
        port=os.environ.get("AURORA_PORT", 5432),
        database=os.environ["AURORA_DB"],
        user=os.environ["AURORA_USER"],
        password=os.environ["AURORA_PASSWORD"],
        cursor_factory=RealDictCursor,
        connect_timeout=5
    )


def execute(query, params=None, fetch=False):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(query, params or ())
        result = cur.fetchall() if fetch else None
        conn.commit()
        return result
    finally:
        conn.close()


def execute_one(query, params=None):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(query, params or ())
        result = cur.fetchone()
        conn.commit()
        return result
    finally:
        conn.close()
