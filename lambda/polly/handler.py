import boto3
import base64
import json
import time

polly = boto3.client('polly', region_name='us-east-1')

VOICE_MAP = {
    'en': ('Joanna', 'en-US',  'neural'),
    'es': ('Lupe',   'es-US',  'neural'),
    'fr': ('Lea',    'fr-FR',  'neural'),
    'de': ('Vicki',  'de-DE',  'neural'),
    'zh': ('Zhiyu',  'cmn-CN', 'standard'),
    'hi': ('Kajal',  'hi-IN',  'neural'),
    'ar': ('Zeina',  'arb',    'standard'),
    'pt': ('Ines',   'pt-PT',  'neural'),
    'ko': ('Seoyeon','ko-KR',  'neural'),
    'ja': ('Mizuki', 'ja-JP',  'standard'),
    'ru': ('Tatyana','ru-RU',  'standard'),
    'it': ('Bianca', 'it-IT',  'neural'),
    'nl': ('Laura',  'nl-NL',  'neural'),
}

CORS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
}


def cw_log(level, event, **ctx):
    print(json.dumps({'level': level, 'event': event, 'ts': time.time(), **ctx}))


def lambda_handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    t0 = time.time()
    try:
        body = json.loads(event.get('body') or '{}')
        text = (body.get('text') or '')[:2500].strip()
        lang = (body.get('language') or 'en')[:2].lower()

        if not text:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'text required'})}

        voice_id, lang_code, engine = VOICE_MAP.get(lang, ('Joanna', 'en-US', 'neural'))
        cw_log('INFO', 'polly_request', lang=lang, voice=voice_id, chars=len(text))

        resp = polly.synthesize_speech(
            Text=text,
            OutputFormat='mp3',
            VoiceId=voice_id,
            LanguageCode=lang_code,
            Engine=engine,
        )

        audio_b64 = base64.b64encode(resp['AudioStream'].read()).decode()
        cw_log('INFO', 'polly_success', lang=lang, voice=voice_id,
               audio_bytes=len(audio_b64), total_ms=round((time.time()-t0)*1000))

        return {
            'statusCode': 200,
            'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps({'audio': audio_b64}),
        }

    except Exception as e:
        cw_log('ERROR', 'polly_error', error=str(e), total_ms=round((time.time()-t0)*1000))
        return {
            'statusCode': 500,
            'headers': CORS,
            'body': json.dumps({'error': str(e)}),
        }
