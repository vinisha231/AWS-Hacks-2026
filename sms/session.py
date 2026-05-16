import json


from db.connection import execute_one, execute

STEPS = ["state", "household_size", "monthly_income", "employment_status", "has_children", "housing_situation"]

QUESTIONS = {
    "state":            "Welcome to Compass! Reply with your 2-letter state (e.g. CA, TX, NY).",
    "household_size":   "How many people live in your household? (including yourself)",
    "monthly_income":   "What is your total monthly household income in dollars? (e.g. 1500)",
    "employment_status":"What is your employment status? Reply: employed, unemployed, part-time, or self-employed",
    "has_children":     "Do you have children under 18 in your household? Reply YES or NO",
    "housing_situation":"What is your housing situation? Reply: renting, owning, or homeless",
    "done":             "Thanks! Checking your eligibility now..."
}


def get_or_create(phone: str) -> dict:
    row = execute_one(
        "SELECT * FROM sms_sessions WHERE phone = %s AND completed = FALSE ORDER BY created_at DESC LIMIT 1",
        (phone,)
    )
    if row:
        return dict(row)
    execute_one("""
        INSERT INTO sms_sessions (phone, step, answers)
        VALUES (%s, %s, %s)
        RETURNING session_id
    """, (phone, 0, json.dumps({})))
    return get_or_create(phone)


def current_question(session: dict) -> str:
    step = session["step"]
    if step >= len(STEPS):
        return QUESTIONS["done"]
    return QUESTIONS[STEPS[step]]


def save_answer(session: dict, answer: str) -> dict:
    step = session["step"]
    if step >= len(STEPS):
        return session

    key = STEPS[step]
    answers = session["answers"] if isinstance(session["answers"], dict) else json.loads(session["answers"])

    # Parse answer into correct type
    if key == "household_size":
        try:
            answers[key] = int(answer.strip())
        except ValueError:
            answers[key] = None
    elif key == "monthly_income":
        try:
            answers[key] = int(answer.strip().replace("$", "").replace(",", ""))
        except ValueError:
            answers[key] = None
    elif key == "has_children":
        answers[key] = answer.strip().upper() in ("YES", "Y", "1", "TRUE")
    else:
        answers[key] = answer.strip().lower()

    new_step = step + 1
    completed = new_step >= len(STEPS)

    execute("""
        UPDATE sms_sessions
        SET step = %s, answers = %s, completed = %s, updated_at = NOW()
        WHERE session_id = %s
    """, (new_step, json.dumps(answers), completed, session["session_id"]))

    session["step"] = new_step
    session["answers"] = answers
    session["completed"] = completed
    return session
