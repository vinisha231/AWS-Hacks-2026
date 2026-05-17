"""
Chatbot handler for program eligibility and guidance.
Integrates with Bedrock to provide conversational AI assistance.
"""

import json
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.bedrock import invoke, invoke_json
from utils.response import ok as _ok, error as _err

def api_response(status, body):
    return _ok(body, status) if status < 400 else _err(body.get('error', str(body)), status)

# Load programs database
PROGRAMS_PATH = Path(__file__).parent.parent / "data" / "programs_db.json"
with open(PROGRAMS_PATH) as f:
    PROGRAMS_DB = json.load(f)


SYSTEM_PROMPT = """You are a helpful benefits advisor assistant for the Benefits Navigator application. 
Your goal is to help users understand:
1. Whether they qualify for specific government benefit programs
2. What documents they need
3. How to apply and next steps
4. Answer questions about specific programs

You have access to these programs:
- SNAP (Food Assistance)
- Medicaid (Health Insurance)
- Section 8 (Housing Vouchers)
- LIHEAP (Energy Assistance)
- TANF (Cash Assistance)
- WIC (Nutrition for Mothers & Children)
- EITC (Earned Income Tax Credit)

When a user asks about a program:
1. First, briefly explain what the program is
2. Ask clarifying questions about their situation (income, family size, location)
3. Provide realistic eligibility assessment
4. List required documents
5. Explain next steps (how to apply)

Be conversational, empathetic, and clear. Use simple language.
If the user mentions specific circumstances (job loss, single parent, etc.), acknowledge this and be supportive.

When discussing eligibility, be honest about:
- Income thresholds (but note these vary by state/location)
- Work requirements or other barriers
- Processing times
- Waiting lists if applicable

Always encourage users to apply - many people qualify and don't know it."""


def lambda_handler(event, context):
    """
    Handle chatbot requests.
    
    Request body:
    {
        "program_id": "snap" (optional - scope discussion to a program),
        "message": "Can I get SNAP if I just lost my job?",
        "session_id": "uuid" (optional - for context tracking)
    }
    
    Response:
    {
        "response": "Assistant message",
        "suggestions": ["Follow-up question 1", "Follow-up question 2"],
        "program_id": "snap" (if applicable)
    }
    """
    try:
        body = json.loads(event.get("body", "{}"))
        message = body.get("message", "").strip()
        program_id = body.get("program_id")
        
        if not message:
            return api_response(400, {"error": "Message required"})
        
        # Build context about the program if specified
        program_context = ""
        if program_id:
            program = next((p for p in PROGRAMS_DB["programs"] if p["id"] == program_id), None)
            if program:
                program_context = f"\n\nThe user is asking about {program['name']}.\n"
                program_context += f"Key eligibility rules: {', '.join(program['eligibilityRules'][:2])}\n"
                program_context += f"Required documents: {', '.join(program['documents'][:3])}"
        
        # Get response from Claude via Bedrock
        full_message = message + program_context
        response_text = invoke(SYSTEM_PROMPT, full_message, max_tokens=1024)
        
        # Generate follow-up suggestions
        suggestions = _generate_suggestions(program_id, message)
        
        return api_response(200, {
            "response": response_text,
            "suggestions": suggestions,
            "program_id": program_id
        })
        
    except Exception as e:
        print(f"Error in chatbot handler: {str(e)}")
        return api_response(500, {"error": str(e)})


def _generate_suggestions(program_id: str, user_message: str) -> list:
    """Generate contextual follow-up suggestions based on the conversation."""
    suggestions = []
    msg_lower = user_message.lower()
    
    # Generic helpful follow-ups
    base_suggestions = [
        "What documents do I need?",
        "How long does it take to apply?",
        "Can I apply online?"
    ]
    
    # Program-specific suggestions
    if program_id == "snap":
        if "income" in msg_lower or "earn" in msg_lower:
            suggestions.append("Are there work requirements for SNAP?")
        suggestions.extend([
            "How much SNAP benefit can I get?",
            "What can I buy with SNAP?"
        ])
    elif program_id == "medicaid":
        if "income" in msg_lower:
            suggestions.append("What's the income limit in my state?")
        suggestions.extend([
            "What healthcare is covered?",
            "Can I get Medicaid if I'm working?"
        ])
    elif program_id == "housing":
        suggestions.extend([
            "What's the average wait time?",
            "How much will I pay for rent?",
            "Are there preferences for approval?"
        ])
    
    return suggestions + base_suggestions[:2]


def get_program_details(program_id: str) -> dict:
    """Get full details for a specific program."""
    program = next((p for p in PROGRAMS_DB["programs"] if p["id"] == program_id), None)
    if program:
        return api_response(200, program)
    return api_response(404, {"error": f"Program {program_id} not found"})


def list_programs() -> dict:
    """List all available programs with basic info."""
    programs_list = [
        {
            "id": p["id"],
            "name": p["name"],
            "agency": p["agency"],
            "description": p["description"]
        }
        for p in PROGRAMS_DB["programs"]
    ]
    return api_response(200, {"programs": programs_list})
