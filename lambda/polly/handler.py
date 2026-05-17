import boto3
import base64
import json

polly = boto3.client('polly', region_name='us-east-1')

# (voice_id, lang_code, engine)
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

def lambda_handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    try:
        body = json.loads(event.get('body') or '{}')
        text = (body.get('text') or '')[:2500].strip()
        lang = (body.get('language') or 'en')[:2].lower()

        if not text:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'text required'})}

        voice_id, lang_code, engine = VOICE_MAP.get(lang, ('Joanna', 'en-US', 'neural'))

        resp = polly.synthesize_speech(
            Text=text,
            OutputFormat='mp3',
            VoiceId=voice_id,
            LanguageCode=lang_code,
            Engine=engine,
        )

        audio_b64 = base64.b64encode(resp['AudioStream'].read()).decode()
        return {
            'statusCode': 200,
            'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps({'audio': audio_b64}),
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS,
            'body': json.dumps({'error': str(e)}),
        }
