# 2025 Federal Poverty Level gross income limits (monthly, by household size)
# Sources: USDA, HHS, HUD

SNAP_GROSS_LIMITS = {
    1: 2311, 2: 3116, 3: 3922, 4: 4728,
    5: 5534, 6: 6340, 7: 7146, 8: 7952
}

MEDICAID_LIMITS = {
    1: 1732, 2: 2336, 3: 2940, 4: 3544,
    5: 4148, 6: 4752, 7: 5356, 8: 5960
}

LIHEAP_LIMITS = {
    1: 1930, 2: 2602, 3: 3274, 4: 3946,
    5: 4618, 6: 5290, 7: 5962, 8: 6634
}

CHIP_LIMITS = {
    1: 3848, 2: 5198, 3: 6547, 4: 7896,
    5: 9246, 6: 10595, 7: 11944, 8: 13294
}

# WIC: up to 185% FPL (monthly)
WIC_LIMITS = {
    1: 2248, 2: 3041, 3: 3833, 4: 4625,
    5: 5418, 6: 6210, 7: 7003, 8: 7795
}

# TANF: varies heavily by state; using federal floor as conservative estimate
TANF_LIMITS = {
    1: 783, 2: 1058, 3: 1331, 4: 1605,
    5: 1878, 6: 2152, 7: 2425, 8: 2699
}

# Section 8 / HCV: up to 50% Area Median Income — using national average estimate
SECTION_8_LIMITS = {
    1: 2500, 2: 2858, 3: 3215, 4: 3573,
    5: 3858, 6: 4143, 7: 4428, 8: 4714
}

# Estimated monthly benefit values (used for ranking)
PROGRAM_VALUES = {
    "SNAP": 230,
    "Medicaid": 450,
    "CHIP": 250,
    "LIHEAP": 42,
    "WIC": 50,
    "TANF": 500,
    "Section 8": 900,
}


def get_limit(table: dict, household_size: int) -> int:
    size = max(1, min(household_size or 1, 8))
    return table[size]
