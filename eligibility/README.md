# Eligibility Module

Runs cross-program eligibility checks against 2025 federal income thresholds.

## Programs Supported

| Program | Benefit | Avg Monthly Value |
|---|---|---|
| Section 8 | Housing Choice Voucher | $900 |
| TANF | Cash assistance for families | $500 |
| Medicaid | Health coverage | $450 |
| CHIP | Children's health coverage | $250 |
| SNAP | Food assistance | $230 |
| WIC | Food + nutrition (pregnant/children) | $50 |
| LIHEAP | Utility bill assistance | $42 |

Results are ranked by estimated monthly dollar value so users see their highest-impact benefits first.

## Flow

1. `handler.py` loads structured intake data from Aurora by `session_id`
2. `programs.py` runs each program's eligibility check against `thresholds.py`
3. Results are persisted to `eligibility_results` table and returned ranked
