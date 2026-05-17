import boto3
import json
import time
import uuid

rds = boto3.client('rds-data', region_name='us-east-1')

CLUSTER_ARN = 'arn:aws:rds:us-east-1:122610507753:cluster:compass-aurora'
SECRET_ARN  = 'arn:aws:secretsmanager:us-east-1:122610507753:secret:compass-aurora-secret-Jl5Aqo'
DATABASE    = 'compassdb'

CORS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}


def cw_log(level, event, **ctx):
    print(json.dumps({'level': level, 'event': event, 'ts': time.time(), **ctx}))


def sql(statement, params=None):
    kwargs = dict(
        resourceArn=CLUSTER_ARN,
        secretArn=SECRET_ARN,
        database=DATABASE,
        sql=statement,
    )
    if params:
        kwargs['parameters'] = params
    return rds.execute_statement(**kwargs)


def ensure_table():
    sql("""CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(36) PRIMARY KEY,
        state VARCHAR(50),
        household_size INT,
        monthly_income INT,
        programs_json TEXT,
        meta_json TEXT,
        created_at BIGINT
    )""")


def lambda_handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    t0 = time.time()
    method = event.get('httpMethod', 'GET')

    try:
        ensure_table()

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            session_id = str(uuid.uuid4())
            answers    = body.get('answers', {})
            programs   = body.get('programs', [])
            meta       = body.get('meta', {})

            sql("""
                INSERT INTO sessions (id, state, household_size, monthly_income, programs_json, meta_json, created_at)
                VALUES (:id, :state, :hs, :income, :programs, :meta, :ts)
            """, [
                {'name': 'id',       'value': {'stringValue': session_id}},
                {'name': 'state',    'value': {'stringValue': answers.get('state', '')}},
                {'name': 'hs',       'value': {'longValue':   answers.get('householdSize', 1)}},
                {'name': 'income',   'value': {'longValue':   int(answers.get('monthlyIncome', 0))}},
                {'name': 'programs', 'value': {'stringValue': json.dumps(programs)}},
                {'name': 'meta',     'value': {'stringValue': json.dumps(meta)}},
                {'name': 'ts',       'value': {'longValue':   int(time.time())}},
            ])

            cw_log('INFO', 'session_saved', session_id=session_id,
                   state=answers.get('state'), programs=len(programs),
                   total_ms=round((time.time() - t0) * 1000))

            return {
                'statusCode': 200,
                'headers': CORS,
                'body': json.dumps({'sessionId': session_id, 'saved': True}),
            }

        else:  # GET
            params     = event.get('queryStringParameters') or {}
            session_id = params.get('id')
            if session_id:
                result = sql(
                    'SELECT * FROM sessions WHERE id = :id LIMIT 1',
                    [{'name': 'id', 'value': {'stringValue': session_id}}]
                )
                rows = result.get('records', [])
                if rows:
                    r = rows[0]
                    return {
                        'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({
                            'sessionId': r[0]['stringValue'],
                            'state':     r[1]['stringValue'],
                            'programs':  json.loads(r[4]['stringValue']),
                            'meta':      json.loads(r[5]['stringValue']),
                        }),
                    }

            result = sql('SELECT id, state, monthly_income, created_at FROM sessions ORDER BY created_at DESC LIMIT 10')
            rows = [
                {'id': r[0]['stringValue'], 'state': r[1]['stringValue'],
                 'income': r[2]['longValue'], 'ts': r[3]['longValue']}
                for r in result.get('records', [])
            ]
            cw_log('INFO', 'sessions_listed', count=len(rows))
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'sessions': rows})}

    except Exception as e:
        cw_log('ERROR', 'session_error', error=str(e), total_ms=round((time.time() - t0) * 1000))
        return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': str(e)})}
