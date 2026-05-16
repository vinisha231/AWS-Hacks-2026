from eligibility.thresholds import (
    SNAP_GROSS_LIMITS, MEDICAID_LIMITS, LIHEAP_LIMITS,
    CHIP_LIMITS, WIC_LIMITS, TANF_LIMITS, SECTION_8_LIMITS,
    PROGRAM_VALUES, get_limit,
    SNAP_ADDITIONAL, MEDICAID_ADDITIONAL, LIHEAP_ADDITIONAL,
    WIC_ADDITIONAL, TANF_ADDITIONAL, SECTION_8_ADDITIONAL
)


def _income_ok(data: dict, table: dict, additional: int = 0) -> bool:
    income = data.get("monthly_income")
    size = data.get("household_size")
    if income is None or size is None:
        return False
    return income <= get_limit(table, size, additional)


PROGRAMS = [
    {
        "name": "SNAP",
        "description": "Monthly food assistance (avg $230/month)",
        "check": lambda d: _income_ok(d, SNAP_GROSS_LIMITS, SNAP_ADDITIONAL)
    },
    {
        "name": "Medicaid",
        "description": "Free or low-cost health coverage",
        "check": lambda d: _income_ok(d, MEDICAID_LIMITS, MEDICAID_ADDITIONAL)
    },
    {
        "name": "CHIP",
        "description": "Low-cost health coverage for children under 19",
        "check": lambda d: (
            _income_ok(d, CHIP_LIMITS) and
            (d.get("has_children") or (d.get("num_children") or 0) > 0)
        )
    },
    {
        "name": "LIHEAP",
        "description": "Help paying heating and cooling bills",
        "check": lambda d: _income_ok(d, LIHEAP_LIMITS, LIHEAP_ADDITIONAL)
    },
    {
        "name": "WIC",
        "description": "Food and nutrition support for pregnant women and children under 5",
        "check": lambda d: (
            _income_ok(d, WIC_LIMITS, WIC_ADDITIONAL) and
            (d.get("is_pregnant") or (d.get("num_children") or 0) > 0)
        )
    },
    {
        "name": "TANF",
        "description": "Monthly cash assistance for families with children",
        "check": lambda d: (
            _income_ok(d, TANF_LIMITS, TANF_ADDITIONAL) and
            (d.get("has_children") or (d.get("num_children") or 0) > 0) and
            d.get("employment_status") in ("unemployed", "part-time", "unknown", None)
        )
    },
    {
        "name": "Section 8",
        "description": "Housing Choice Voucher — rental subsidy (avg $900/month)",
        "check": lambda d: (
            _income_ok(d, SECTION_8_LIMITS, SECTION_8_ADDITIONAL) and
            d.get("housing_situation") in ("renting", "homeless", "other", "unknown", None)
        )
    },
]


def check_all(structured: dict) -> list:
    results = []
    for program in PROGRAMS:
        eligible = program["check"](structured)
        results.append({
            "program": program["name"],
            "description": program["description"],
            "eligible": eligible,
            "estimated_monthly_value": PROGRAM_VALUES.get(program["name"], 0) if eligible else 0
        })

    # Sort eligible programs by dollar value descending
    results.sort(key=lambda r: r["estimated_monthly_value"], reverse=True)
    return results
