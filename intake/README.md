# Intake Module

Handles conversational intake using Amazon Bedrock and Amazon Translate.

## Flow

1. User sends a free-text message in any language (e.g. "I lost my job last month, I have 3 kids and we're renting")
2. Amazon Translate converts the message to English if needed
3. Amazon Bedrock extracts structured eligibility fields (income, household size, state, etc.)
4. Session is saved to Aurora and a `session_id` is returned
5. Confirmation message is translated back to the user's language

## Fields Extracted

| Field | Type |
|---|---|
| household_size | integer |
| monthly_income | integer (USD) |
| state | 2-letter code |
| employment_status | employed / unemployed / part-time / self-employed |
| has_children | boolean |
| num_children | integer |
| has_disability | boolean |
| is_veteran | boolean |
| housing_situation | renting / owning / homeless / other |
| is_pregnant | boolean |
| age | integer |
