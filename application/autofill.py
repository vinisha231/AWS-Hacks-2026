"""
Maps structured intake data to pre-filled application form fields
for each supported benefits program.
"""

FIELD_MAPS = {
    "SNAP": {
        "household_size": "household_size",
        "monthly_income": "gross_monthly_income",
        "state": "state_of_residence",
        "employment_status": "employment_status",
        "num_children": "number_of_dependents",
        "housing_situation": "living_situation",
    },
    "Medicaid": {
        "household_size": "household_size",
        "monthly_income": "monthly_household_income",
        "state": "state",
        "has_disability": "has_disability",
        "is_pregnant": "is_pregnant",
        "age": "applicant_age",
    },
    "CHIP": {
        "household_size": "family_size",
        "monthly_income": "monthly_income",
        "state": "state",
        "num_children": "number_of_children",
    },
    "LIHEAP": {
        "household_size": "household_size",
        "monthly_income": "monthly_income",
        "state": "state",
        "housing_situation": "housing_type",
    },
    "WIC": {
        "monthly_income": "household_monthly_income",
        "household_size": "household_size",
        "is_pregnant": "is_pregnant",
        "num_children": "number_of_children_under_5",
        "state": "state",
    },
    "TANF": {
        "household_size": "family_size",
        "monthly_income": "gross_monthly_income",
        "num_children": "number_of_children",
        "employment_status": "current_employment_status",
        "state": "state",
    },
    "Section 8": {
        "household_size": "household_size",
        "monthly_income": "annual_gross_income",
        "state": "state",
        "housing_situation": "current_housing_status",
        "num_children": "number_of_dependents",
        "has_disability": "disability_status",
        "is_veteran": "veteran_status",
    },
}


def autofill(program: str, structured: dict) -> dict:
    field_map = FIELD_MAPS.get(program, {})
    form_data = {}

    for intake_field, form_field in field_map.items():
        value = structured.get(intake_field)
        if value is not None:
            # Convert monthly income to annual for Section 8
            if program == "Section 8" and intake_field == "monthly_income":
                value = value * 12
            form_data[form_field] = value

    return form_data
