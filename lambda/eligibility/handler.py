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

        prompt = f"""US benefits expert. List the top 8 assistance programs for this household. Be specific to {state}.

Profile: {state}, {household_size} people, ${monthly_income}/mo, members: {members_str}, employment: {employment}, health: {health_coverage}, housing: {housing_status}, citizenship: {citizenship}, already has: {benefits_str}.

Exclude programs they already have. Include state-specific {state} programs.

IMPORTANT for applicationUrl: Use ONLY these reliable URLs — never invent deep links:
- Federal programs (SNAP, Medicaid, LIHEAP, WIC, SSI, TANF, Section 8): "https://www.benefits.gov"
- State-specific {state} programs: use only the main homepage of the state agency (e.g. "https://dhhs.state.name.us" NOT a subpage). If unsure, use "https://www.benefits.gov".

Return ONLY a JSON array (no markdown). Each item: {{"id":"snap","name":"SNAP","fullName":"Supplemental Nutrition Assistance Program","category":"food","description":"Monthly food benefits.","why":"Qualifies due to income below 130% FPL.","estimatedAnnual":3600,"applicationUrl":"https://www.benefits.gov","documents":["Photo ID","Proof of income"],"renewalMonths":12,"waitlist":false}}

Categories: food, health, housing, energy, financial, education. Return JSON array only."""

        response = bedrock.invoke_model(
            modelId='us.anthropic.claude-sonnet-4-6',
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens': 2048,
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
