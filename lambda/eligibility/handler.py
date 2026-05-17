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

def lambda_handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    try:
        body = json.loads(event.get('body') or '{}')
        a = body.get('answers', {})

        state            = a.get('state', 'the United States')
        household_size   = a.get('householdSize', 1)
        income_range     = a.get('incomeRange', 'unknown')
        monthly_income   = a.get('monthlyIncome', 2500)
        members          = a.get('householdMembers', [])
        employment       = a.get('employment', 'unknown')
        health_coverage  = a.get('healthCoverage', 'unknown')
        housing_status   = a.get('housingStatus', 'unknown')
        citizenship      = a.get('citizenship', 'citizens')
        current_benefits = a.get('currentBenefits', [])

        members_str  = ', '.join(members)  if members          else 'adults only'
        benefits_str = ', '.join(current_benefits) if current_benefits else 'none'

        prompt = f"""You are a US government benefits eligibility expert with deep knowledge of both federal programs and every state's specific programs.

A person in {state} needs help finding assistance programs. Here is their profile:
- State: {state}
- Household size: {household_size} people
- Monthly income: ~${monthly_income}/month ({income_range})
- Household members: {members_str}
- Employment: {employment}
- Health coverage: {health_coverage}
- Housing situation: {housing_status}
- Immigration/citizenship: {citizenship}
- Already receiving: {benefits_str}

Identify ALL federal AND {state}-specific assistance programs this household qualifies for. Be thorough — include food, health, housing, energy, childcare, education, and financial programs. Include programs specific to {state} that many people don't know about.

Exclude any programs they are already receiving ({benefits_str}).

Return ONLY a valid JSON array. Each object must have exactly these fields:
- "id": unique lowercase string with underscores (e.g., "snap", "ca_calworks")
- "name": short program name (e.g., "SNAP", "CalWORKs")
- "fullName": complete official program name
- "category": one of: "food", "health", "housing", "energy", "financial", "education"
- "description": 1-2 sentence plain-English description
- "why": specific reason THIS person qualifies based on their actual profile
- "estimatedAnnual": realistic annual benefit amount as a number (not a string)
- "applicationUrl": official .gov application URL
- "documents": array of 3-5 required documents (plain strings)
- "renewalMonths": months until renewal required (number)
- "waitlist": true or false

Return only the JSON array. No markdown, no explanation, no code blocks."""

        response = bedrock.invoke_model(
            modelId='us.anthropic.claude-sonnet-4-6',
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens': 4096,
                'messages': [{'role': 'user', 'content': prompt}],
            }),
        )

        raw = json.loads(response['body'].read())
        text = raw['content'][0]['text'].strip()

        # Extract JSON array robustly
        match = re.search(r'\[.*\]', text, re.DOTALL)
        programs = json.loads(match.group() if match else text)

        # Normalize and sort
        for p in programs:
            p.setdefault('nameKey',  p.get('name', p.get('id', '')))
            p.setdefault('descKey',  p.get('description', ''))
            p.setdefault('whyKey',   p.get('why', ''))
            p.setdefault('fullKey',  p.get('fullName', p.get('name', '')))
            p.setdefault('documents', [])
            p.setdefault('renewalMonths', 12)
            p.setdefault('waitlist', False)
            p.setdefault('applicationUrl', 'https://benefits.gov')
            try:
                p['estimatedAnnual'] = int(float(str(p.get('estimatedAnnual', 0)).replace(',', '')))
            except (ValueError, TypeError):
                p['estimatedAnnual'] = 0

        programs.sort(key=lambda x: x.get('estimatedAnnual', 0), reverse=True)

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'programs': programs, 'source': 'bedrock', 'state': state}),
        }

    except Exception as e:
        print(f'Error: {e}')
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e), 'programs': []}),
        }
