# Program Chatbot Feature

## Overview

The Program Chatbot is an AI-powered assistant that helps users understand benefit programs, eligibility requirements, and application processes. It's integrated into the Results page as an expandable chat interface for each program.

## Features

- **AI-Powered Assistance**: Uses AWS Bedrock (Claude 3.5) for conversational responses
- **Program-Specific Guidance**: Scoped conversations to individual benefit programs
- **Interview-Style Questions**: Guides users through eligibility assessment
- **Natural Conversation**: Empathetic, supportive tone for sensitive topics
- **Smart Suggestions**: Context-aware follow-up suggestions for continued assistance
- **Document Requirements**: Explains what documents are needed
- **Application Guidance**: Walks users through the application process

## Architecture

### Backend
- **`chatbot/handler.py`**: Lambda handler for chatbot requests
- **`data/programs_db.json`**: Database of benefit program information
- **`utils/bedrock.py`**: Existing Bedrock integration (used for Claude API calls)

### Frontend
- **`src/components/ProgramChatbot.jsx`**: React chatbot component
- **`src/services/chatbotApi.js`**: API service for chatbot communication
- **`src/pages/Results.jsx`**: Integration point in results display

## How It Works

### User Flow
1. User views Results page with eligible programs
2. User clicks "Ask" button on any program card
3. Chatbot window opens with program context
4. User asks questions about eligibility, documents, or process
5. Claude responds with helpful, specific guidance
6. User can ask follow-up questions or close the chat

### Backend Flow
1. Frontend sends message + program_id to `/api/chatbot`
2. Handler loads program details from database
3. Sends message to Claude via Bedrock with program context
4. Returns response + contextual suggestions
5. Frontend displays response and updates UI

## Available Programs

The chatbot has knowledge of these programs:
- **SNAP**: Food assistance
- **Medicaid**: Health insurance for low-income individuals
- **Section 8**: Housing vouchers and rental assistance
- **LIHEAP**: Energy/utility assistance
- **TANF**: Temporary cash assistance for families
- **WIC**: Nutrition program for mothers and children
- **EITC**: Earned Income Tax Credit

## Deployment

### Prerequisites
- AWS Bedrock access with Claude 3.5 model enabled
- AWS Lambda environment configured
- API Gateway set up to route `/chatbot` requests

### Steps

1. **Upload Lambda Function**
   ```bash
   cd chatbot/
   zip -r lambda_function.zip handler.py ../data/programs_db.json ../utils/
   aws lambda update-function-code \
     --function-name benefits-navigator-chatbot \
     --zip-file fileb://lambda_function.zip
   ```

2. **API Gateway Integration**
   - Add route: `POST /chatbot`
   - Link to `chatbot.handler.lambda_handler`
   - Enable CORS if calling from different domain

3. **Environment Variables**
   - Ensure `AWS_REGION=us-east-1` (for Bedrock)
   - Bedrock access already enabled in AWS account

### Frontend Environment
- `VITE_API_BASE`: Base URL for API calls (defaults to `/api`)

## Usage Examples

### Example: User unsure about SNAP eligibility after job loss
```
User: "I just lost my job. Can I get SNAP?"

Bot: "I'm sorry to hear about your job loss. SNAP can be an excellent resource 
during this transition. Let me help you understand if you qualify.

A few quick questions:
1. Do you have any savings or assets? (SNAP has limits)
2. What state are you in? (Rules vary by state)
3. Are you living with family or alone?

Generally, SNAP looks at your income - after job loss, many people qualify..."
```

### Example: Questions about required documents
```
User: "What documents do I need to apply?"

Bot: "Great question! For SNAP, you'll typically need:

1. **Proof of Identity**
   - Driver's license, passport, or state ID
   - Birth certificate

2. **Proof of Income**
   - Recent pay stubs (even if from previous job)
   - Tax returns from last 2 years
   - Unemployment benefits statement

3. **Proof of Residency**
   - Utility bill, lease, or mortgage statement
   - Must be recent (within 30 days usually)

4. **Social Security Number**
   - For all household members

The exact requirements vary by state, so I recommend contacting your 
local SNAP office to confirm..."
```

## Extending the Chatbot

### Adding New Programs
1. Add program to `data/programs_db.json` with:
   - `id`: unique identifier
   - `name`: program name
   - `agency`: administering agency
   - `eligibilityRules`: list of requirements
   - `documents`: list of required documents
   - `url`: official program website

2. Update system prompt in `handler.py` to mention new program

### Customizing Responses
Edit the `SYSTEM_PROMPT` in `chatbot/handler.py` to change:
- Tone (more or less formal)
- Focus areas (emphasis on eligibility vs. benefits vs. process)
- Language/vocabulary level
- Specific guidance approach

### Adding Conversation Context
For logged-in users, you could:
1. Pass `session_id` to chatbot endpoint
2. Store conversation history in DynamoDB
3. Provide context from user's previous answers
4. Personalize responses based on user circumstances

## Troubleshooting

### Chatbot returns generic responses
- Check that `program_id` is being passed correctly
- Verify `programs_db.json` is properly formatted
- Ensure Claude model has loaded the program context

### API requests failing
- Verify Lambda function has Bedrock permissions
- Check that Bedrock region is `us-east-1`
- Confirm API Gateway route is configured correctly
- Check browser console for CORS errors

### Slow responses
- Claude responses can take 2-5 seconds
- Consider adding loading animation (already implemented)
- Could cache common questions if needed

## Future Enhancements

1. **Conversation History**: Store conversations per user for continuity
2. **Real-time Document Checklist**: Track required documents as user answers questions
3. **Localized Content**: Integrate with state-specific eligibility rules
4. **Document Upload Integration**: Direct upload from chat interface
5. **Application Pre-fill**: Auto-fill applications based on chat responses
6. **Multi-language Support**: Use existing translation infrastructure
7. **Feedback Loop**: Rate chatbot responses to improve accuracy

## Security Considerations

- User questions are sent to Bedrock (AWS-hosted)
- Don't include sensitive info in system prompt
- No permanent storage of chat history by default
- Consider adding data encryption for future enhancements

## Files Created

```
chatbot/
├── __init__.py
├── handler.py                 # Main Lambda handler
└── README.md                  # This file

src/
├── components/
│   └── ProgramChatbot.jsx    # React chat component
└── services/
    └── chatbotApi.js         # API service layer

data/
└── programs_db.json          # Program database

api/
└── routes.py                 # Updated with /chatbot route
```

## Support

For issues or feature requests, please refer to the main project README.
