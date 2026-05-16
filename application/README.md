# Application Module

Handles application creation, auto-fill, document upload, submission, and status tracking.

## Endpoints

| Action | Description |
|---|---|
| `create` | Creates a draft application with form fields pre-filled from intake data |
| `submit` | Marks application as submitted, schedules renewal reminder via SNS |
| `upload` | Uploads a document to S3 and links it to the application |
| `status` | Returns current application status + list of uploaded documents |

## Supported Document Types

- `pay_stub`
- `government_id`
- `lease_agreement`
- `tax_return`
- `utility_bill`
- `other`

## Auto-Fill

Each program has its own field map in `autofill.py`. Intake fields are mapped to the program's
official form field names. Section 8 receives annual income (monthly × 12) as required by HUD forms.

## Renewal Reminders

On submission, a record is written to `renewal_reminders` (330 days out) and an SNS message
is published so the notification service can send an SMS/email reminder before the benefit expires.
