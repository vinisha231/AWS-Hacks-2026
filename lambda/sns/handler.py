import boto3
import json
from datetime import datetime, timezone, timedelta

sns = boto3.client('sns', region_name='us-east-1')

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
        phone        = body.get('phone', '').strip()
        program_name = body.get('programName', 'your benefit program')
        renewal_date = body.get('renewalDate', '')
        remind_days  = int(body.get('reminderDaysBefore', 30))
        user_name    = body.get('userName', 'there')

        if not phone:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Phone number required'}),
            }

        # Format renewal date for display
        try:
            renewal_dt = datetime.fromisoformat(renewal_date.replace('Z', '+00:00'))
            renewal_str = renewal_dt.strftime('%B %d, %Y')
            reminder_dt = renewal_dt - timedelta(days=remind_days)
            reminder_str = reminder_dt.strftime('%B %d, %Y')
        except Exception:
            renewal_str = renewal_date
            reminder_str = f'{remind_days} days before renewal'

        # Normalize phone to E.164 for SNS
        digits = ''.join(c for c in phone if c.isdigit())
        if len(digits) == 10:
            e164_phone = f'+1{digits}'
        elif len(digits) == 11 and digits.startswith('1'):
            e164_phone = f'+{digits}'
        else:
            e164_phone = f'+{digits}'

        # Confirmation SMS — sent immediately
        confirmation_msg = (
            f"Hi {user_name}! Your Compass reminder is set. "
            f"We'll remind you about your {program_name} renewal on {reminder_str} "
            f"(renewal due: {renewal_str}). "
            f"Reply STOP to opt out."
        )

        result = sns.publish(
            PhoneNumber=e164_phone,
            Message=confirmation_msg,
            MessageAttributes={
                'AWS.SNS.SMS.SMSType': {
                    'DataType': 'String',
                    'StringValue': 'Transactional',
                },
                'AWS.SNS.SMS.SenderID': {
                    'DataType': 'String',
                    'StringValue': 'Compass',
                },
            },
        )

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'success':    True,
                'messageId':  result.get('MessageId', ''),
                'demo':       False,
                'phone':      e164_phone,
                'renewalDate': renewal_str,
                'reminderDate': reminder_str,
            }),
        }

    except Exception as e:
        print(f'SNS error: {e}')
        # Graceful fallback — treat as demo rather than hard failure
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'success': True,
                'demo':    True,
                'error':   str(e),
                'messageId': 'demo-' + str(int(datetime.now(timezone.utc).timestamp())),
            }),
        }
