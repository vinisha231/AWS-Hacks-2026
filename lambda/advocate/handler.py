import boto3
import json
import re

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json',
}

MODEL = 'us.anthropic.claude-sonnet-4-6'


def invoke(messages, system=None, max_tokens=800):
    body = {
        'anthropic_version': 'bedrock-2023-05-31',
        'max_tokens': max_tokens,
        'messages': messages,
    }
    if system:
        body['system'] = system
    raw = bedrock.invoke_model(modelId=MODEL, body=json.dumps(body))
    return json.loads(raw['body'].read())['content'][0]['text'].strip()


def lambda_handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    try:
        body = json.loads(event.get('body') or '{}')
        mode         = body.get('mode', 'letter')
        program_name = body.get('program_name', 'this program')
        program_full = body.get('program_full', program_name)
        user_name    = body.get('user_name', 'Applicant')
        profile      = body.get('profile', {})
        message      = body.get('message', '')
        history      = body.get('history', [])

        state    = profile.get('state', 'the US')
        income   = profile.get('monthlyIncome', 'unknown')
        hh_size  = profile.get('householdSize', 1)
        members  = ', '.join(profile.get('householdMembers', [])) or 'adults'
        housing  = profile.get('housingStatus', 'unknown')
        cit      = profile.get('citizenship', 'citizen')

        if mode == 'letter':
            prompt = f"""Write a concise 1-page advocacy letter for {user_name} applying for {program_full} in {state}.

Applicant profile: {hh_size}-person household, ${income}/mo income, members: {members}, housing: {housing}, citizenship: {cit}.

FORMAT — output exactly this, no extra text:
LETTER:
[3-paragraph letter addressed to caseworker. Para 1: introduce applicant and program. Para 2: state why they clearly qualify (income, household). Para 3: request timely approval and offer to provide documents. Keep under 250 words total. Professional but warm tone.]

TALKING_POINTS:
- [point 1]
- [point 2]
- [point 3]

OBJECTIONS:
- [common objection and 1-sentence response]
- [common objection and 1-sentence response]"""

            text = invoke([{'role': 'user', 'content': prompt}], max_tokens=900)

            # Parse sections
            letter = ''
            talking_points = []
            objections = []

            letter_match = re.search(r'LETTER:\s*(.*?)(?=TALKING_POINTS:|$)', text, re.DOTALL)
            tp_match = re.search(r'TALKING_POINTS:\s*(.*?)(?=OBJECTIONS:|$)', text, re.DOTALL)
            obj_match = re.search(r'OBJECTIONS:\s*(.*?)$', text, re.DOTALL)

            if letter_match:
                letter = letter_match.group(1).strip()
            if tp_match:
                talking_points = [
                    line.lstrip('- •').strip()
                    for line in tp_match.group(1).strip().splitlines()
                    if line.strip() and line.strip() not in ('-', '•')
                ]
            if obj_match:
                objections = [
                    line.lstrip('- •').strip()
                    for line in obj_match.group(1).strip().splitlines()
                    if line.strip() and line.strip() not in ('-', '•')
                ]

            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'mode': 'letter',
                    'letter': letter or text,
                    'talking_points': talking_points,
                    'objections': objections,
                }),
            }

        elif mode == 'roleplay':
            system_prompt = (
                f"You are a {state} government caseworker conducting an eligibility interview for {program_name}. "
                f"Be professional, slightly formal, but helpful. Ask realistic questions about income, household, and documents. "
                f"Keep each response to 2-3 sentences. If this is the opening (no user message yet), greet the applicant and ask your first question."
            )

            msgs = []
            for h in history:
                if h.get('role') and h.get('content'):
                    msgs.append({'role': h['role'], 'content': h['content']})
            if message:
                msgs.append({'role': 'user', 'content': message})
            if not msgs:
                msgs.append({'role': 'user', 'content': 'Begin the interview.'})

            reply = invoke(msgs, system=system_prompt, max_tokens=250)

            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({'mode': 'roleplay', 'reply': reply}),
            }

        else:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': f'Unknown mode: {mode}'}),
            }

    except Exception as e:
        print(f'Error: {e}')
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)}),
        }
