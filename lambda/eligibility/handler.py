import boto3
import json
import re
import time

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json',
}

def cw_log(level, event, **ctx):
    print(json.dumps({'level': level, 'event': event, 'ts': time.time(), **ctx}))

def lambda_handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    t0 = time.time()
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

        cw_log('INFO', 'eligibility_request', state=state, household_size=household_size,
               monthly_income=monthly_income, housing_status=housing_status)

        members_str  = ', '.join(members) if members else 'adults only'
        benefits_str = ', '.join(current_benefits) if current_benefits else 'none'

        # Server-side urgency logic
        is_urgent = (
            housing_status == 'homeless' or
            monthly_income < 500 or
            (monthly_income < 1200 and any(m in members for m in ['infant', 'toddler'])) or
            (monthly_income < 800 and household_size >= 3)
        )

        snap_threshold = 1580 + max(0, household_size - 1) * 560
        snap_fallback = (
            monthly_income > snap_threshold and
            monthly_income < snap_threshold * 1.6 and
            'snap' not in benefits_str.lower()
        )

        urgent_note = (
            f"URGENT: housing={housing_status}, income=${monthly_income}/mo — prioritize immediate-access resources. "
            if is_urgent else ""
        )

        prompt = f"""You are a US government benefits specialist. {urgent_note}

Household profile: {state}, {household_size} people, ${monthly_income}/mo income, members: {members_str}, employment: {employment}, health coverage: {health_coverage}, housing: {housing_status}, citizenship: {citizenship}, currently receiving: {benefits_str}.

Return ONLY the following JSON object — no markdown, no explanation:
{{
  "programs": [
    {{
      "id": "snap",
      "name": "SNAP",
      "fullName": "Supplemental Nutrition Assistance Program",
      "category": "food",
      "description": "Monthly grocery benefits loaded onto an EBT card.",
      "why": "Income of ${monthly_income}/mo is below the 130% FPL threshold for a household of {household_size}.",
      "estimatedAnnual": 3600,
      "applicationUrl": "https://www.benefits.gov",
      "documents": ["Photo ID", "Proof of income", "Proof of residency"],
      "renewalMonths": 12,
      "waitlist": false,
      "pros": ["Immediate grocery relief", "Accepted at 250,000+ retailers"],
      "cons": ["Must recertify every 6-12 months", "Benefits may not cover full food costs"],
      "steps": ["Visit benefits.gov and search SNAP", "Complete the online application with household and income details", "Upload proof of income and ID", "Attend a scheduled phone or in-person interview", "Receive a decision within 30 days", "Activate your EBT card once approved"]
    }}
  ],
  "urgentResources": [
    {{
      "name": "211 Helpline",
      "type": "crisis",
      "description": "Call or text 2-1-1 for immediate referrals to food, shelter, and crisis services in {state}.",
      "phone": "211",
      "website": "https://www.211.org"
    }}
  ],
  "nonprofits": [
    {{
      "name": "Feeding America – {state}",
      "type": "food",
      "description": "Connects families to the nearest food bank and pantry in {state}.",
      "phone": "1-800-771-2303",
      "website": "https://www.feedingamerica.org"
    }}
  ]
}}

Instructions:
- programs: list the top 8 programs this household qualifies for in {state}. Exclude programs in "{benefits_str}". Prioritize highest estimated annual value. Include at least 1-2 {state}-specific state programs. Categories: food, health, housing, energy, financial, education.
- applicationUrl: federal programs → "https://www.benefits.gov"; state programs → only the main agency homepage (no subpages); if unsure → "https://www.benefits.gov"
- urgentResources: 3-5 resources available TODAY or THIS WEEK (no application required). Always include 211 first. Add {state} emergency food banks, shelters, and crisis lines. Real organizations only.
- nonprofits: 4-6 real {state} nonprofits for longer-term support — include local United Way chapter, Salvation Army, community action agency, legal aid society, and a free health clinic if applicable.
- Return valid minified JSON only."""

        bedrock_t0 = time.time()
        response = bedrock.invoke_model(
            modelId='us.anthropic.claude-sonnet-4-6',
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens': 3500,
                'messages': [{'role': 'user', 'content': prompt}],
            }),
        )
        bedrock_ms = round((time.time() - bedrock_t0) * 1000)

        raw = json.loads(response['body'].read())
        text = raw['content'][0]['text'].strip()

        match = re.search(r'\{.*\}', text, re.DOTALL)
        parsed = json.loads(match.group() if match else text)

        programs         = parsed.get('programs', [])
        urgent_resources = parsed.get('urgentResources', [])
        nonprofits       = parsed.get('nonprofits', [])

        for p in programs:
            p.setdefault('nameKey',  p.get('name', p.get('id', '')))
            p.setdefault('descKey',  p.get('description', ''))
            p.setdefault('whyKey',   p.get('why', ''))
            p.setdefault('fullKey',  p.get('fullName', p.get('name', '')))
            p.setdefault('documents', [])
            p.setdefault('renewalMonths', 12)
            p.setdefault('waitlist', False)
            p.setdefault('applicationUrl', 'https://www.benefits.gov')
            p.setdefault('pros', [])
            p.setdefault('cons', [])
            p.setdefault('steps', [])
            try:
                p['estimatedAnnual'] = int(float(str(p.get('estimatedAnnual', 0)).replace(',', '')))
            except (ValueError, TypeError):
                p['estimatedAnnual'] = 0

        programs.sort(key=lambda x: x.get('estimatedAnnual', 0), reverse=True)

        total_ms = round((time.time() - t0) * 1000)
        cw_log('INFO', 'eligibility_success',
               state=state, programs_returned=len(programs),
               is_urgent=is_urgent, bedrock_ms=bedrock_ms, total_ms=total_ms)

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'programs':        programs,
                'isUrgent':        is_urgent,
                'snapFallback':    snap_fallback,
                'urgentResources': urgent_resources,
                'nonprofits':      nonprofits,
                'source':          'bedrock',
                'state':           state,
            }),
        }

    except Exception as e:
        cw_log('ERROR', 'eligibility_error', error=str(e), total_ms=round((time.time()-t0)*1000))
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e), 'programs': []}),
        }
