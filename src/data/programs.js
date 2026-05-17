// 2024 Federal Poverty Level (annual)
const FPL = { 1: 15060, 2: 20440, 3: 25820, 4: 31200, 5: 36580, 6: 41960, 7: 47340, 8: 52720 }

export function getFPL(size) {
  const s = Math.max(1, Math.min(8, size))
  if (size <= 8) return FPL[s]
  return FPL[8] + (size - 8) * 5380
}

export function getAnnualIncome(a) {
  return typeof a.monthlyIncome === 'number' && !Number.isNaN(a.monthlyIncome)
    ? a.monthlyIncome * 12
    : null
}

export const INCOME_BRACKETS = {
  'Under $1,000':       500,
  '$1,000 – $1,500':   1250,
  '$1,500 – $2,000':   1750,
  '$2,000 – $2,500':   2250,
  '$2,500 – $3,500':   3000,
  '$3,500 – $5,000':   4250,
  'Over $5,000':        6000,
  'I prefer not to say': null,
}

// Helper: check if household has children of certain age groups
function hasInfant(a)      { return a.householdMembers?.includes('infant') }
function hasToddler(a)     { return a.householdMembers?.includes('toddler') }
function hasYoungChild(a)  { return hasInfant(a) || hasToddler(a) }
function hasSchoolChild(a) { return a.householdMembers?.includes('school_child') }
function hasTeen(a)        { return a.householdMembers?.includes('teen') }
function hasMinor(a)       { return hasYoungChild(a) || hasSchoolChild(a) || hasTeen(a) }
function hasChild18(a)     { return hasSchoolChild(a) || hasTeen(a) }
function hasPregnant(a)    { return a.householdMembers?.includes('pregnant') }
function hasDisabled(a)    { return a.householdMembers?.includes('disabled') }
function hasSenior(a)      { return a.householdMembers?.includes('senior') }
function hasVeteran(a)     { return a.householdMembers?.includes('veteran') }
function isEmployed(a)     { return a.employment === 'employed' || a.employment === 'self_employed' }
function isUnemployed(a)   { return a.employment === 'unemployed' || a.employment === 'recently_unemployed' || a.employment === 'not_working' }
function isStudent(a)      { return a.employment === 'student' }
function isUninsured(a)    { return a.healthCoverage === 'none' }
function onMedicare(a)     { return a.healthCoverage === 'medicare' }
function onMedicaid(a)     { return a.healthCoverage === 'medicaid' || a.currentBenefits?.includes('medicaid') }
function onSNAP(a)         { return a.currentBenefits?.includes('snap') }
function onSSI(a)          { return a.currentBenefits?.includes('ssi') }
function onHousing(a)      { return a.currentBenefits?.includes('housing') }
function isHomeless(a)     { return a.housingStatus === 'homeless' || a.householdMembers?.includes('homeless') }
function isCitizenEligible(a) {
  return !a.citizenship || a.citizenship === 'citizens' || a.citizenship === 'lpr' || a.citizenship === 'mixed' || a.citizenship === 'prefer_not'
}

export const PROGRAMS = [
  // ── FOOD ─────────────────────────────────────────────────────────────────
  {
    id: 'snap',
    nameKey: 'prog_snap_name',
    fullKey: 'prog_snap_full',
    descKey: 'prog_snap_desc',
    whyKey:  'prog_snap_why',
    category: 'food',
    icon: '🛒',
    color: '#16a34a',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    estimatedAnnual: (size) => {
      const monthly = Math.min(1756, 281 + (size - 1) * 155)
      return Math.round(monthly * 12 / 100) * 100
    },
    timeToBenefit: '~30 days (expedited available)',
    difficulty: 'Low',
    renewalMonths: 12,
    applicationUrl: 'https://www.fns.usda.gov/snap/state-directory',
    documents: ['Government-issued ID', 'Proof of income (pay stubs or tax return)', 'Proof of residence (lease or utility bill)', 'Social Security numbers for all household members'],
    check: (a) => {
      const annualIncome = getAnnualIncome(a)
      if (onSNAP(a)) return false
      if (!isCitizenEligible(a)) return false
      // Students 18-49 enrolled full-time are generally ineligible unless working 20+ hrs
      if (isStudent(a) && !isEmployed(a)) return false
      if (annualIncome === null) return false
      const fplLimit = getFPL(a.householdSize) * 1.30
      return annualIncome <= fplLimit
    },
  },
  {
    id: 'wic',
    nameKey: 'prog_wic_name',
    fullKey: 'prog_wic_full',
    descKey: 'prog_wic_desc',
    whyKey:  'prog_wic_why',
    category: 'food',
    icon: '🤱',
    color: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    estimatedAnnual: () => 1800,
    timeToBenefit: '2–6 weeks',
    difficulty: 'Low',
    renewalMonths: 6,
    applicationUrl: 'https://www.fns.usda.gov/wic/wic-how-apply',
    documents: ['ID for each applicant', 'Proof of income', 'Proof of residence', 'Proof of pregnancy or child\'s birth certificate'],
    check: (a) => {
      // WIC: pregnant, postpartum, breastfeeding women, or children under 5
      const annualIncome = getAnnualIncome(a)
      const qualifies = hasPregnant(a) || hasInfant(a) || hasToddler(a)
      if (!qualifies) return false
      if (annualIncome === null) return false
      const fplLimit = getFPL(a.householdSize) * 1.85
      return annualIncome <= fplLimit
    },
  },
  {
    id: 'lunch',
    nameKey: 'prog_lunch_name',
    fullKey: 'prog_lunch_full',
    descKey: 'prog_lunch_desc',
    whyKey:  'prog_lunch_why',
    category: 'food',
    icon: '🍽️',
    color: '#65a30d',
    bgColor: '#f7fee7',
    borderColor: '#d9f99d',
    estimatedAnnual: () => 900,
    renewalMonths: 12,
    applicationUrl: 'https://www.fns.usda.gov/nslp',
    documents: ['Completed school meal application', 'Proof of income or SNAP/Medicaid enrollment letter'],
    check: (a) => {
      const annualIncome = getAnnualIncome(a)
      if (!hasChild18(a)) return false
      if (annualIncome === null) return false
      const fplLimit = getFPL(a.householdSize) * 1.85
      return annualIncome <= fplLimit
    },
  },

  // ── HEALTH ───────────────────────────────────────────────────────────────
  {
    id: 'medicaid',
    nameKey: 'prog_medicaid_name',
    fullKey: 'prog_medicaid_full',
    descKey: 'prog_medicaid_desc',
    whyKey:  'prog_medicaid_why',
    category: 'health',
    icon: '🏥',
    color: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    estimatedAnnual: () => 8400,
    timeToBenefit: '2–8 weeks',
    difficulty: 'Medium',
    renewalMonths: 12,
    applicationUrl: 'https://www.healthcare.gov/medicaid-chip/getting-medicaid-chip/',
    documents: ['Government-issued ID', 'Proof of income', 'Proof of citizenship or immigration status', 'Social Security number'],
    check: (a) => {
      const annualIncome = getAnnualIncome(a)
      if (onMedicaid(a)) return false
      if (!isCitizenEligible(a)) return false
      if (annualIncome === null) return false
      const fplLimit = getFPL(a.householdSize) * 1.38
      // Pregnant women qualify up to 200% FPL in most states
      const limit = hasPregnant(a) ? getFPL(a.householdSize) * 2.0 : fplLimit
      return annualIncome <= limit
    },
  },
  {
    id: 'chip',
    nameKey: 'prog_chip_name',
    fullKey: 'prog_chip_full',
    descKey: 'prog_chip_desc',
    whyKey:  'prog_chip_why',
    category: 'health',
    icon: '👶',
    color: '#0891b2',
    bgColor: '#ecfeff',
    borderColor: '#a5f3fc',
    estimatedAnnual: () => 4800,
    renewalMonths: 12,
    applicationUrl: 'https://www.insurekidsnow.gov/coverage/index.html',
    documents: ['Child\'s birth certificate', 'Proof of income', 'Proof of residence', 'Social Security numbers'],
    check: (a) => {
      const annualIncome = getAnnualIncome(a)
      // CHIP: children under 19, income 138%-300% FPL (above Medicaid, below CHIP limit)
      if (onMedicaid(a)) return false
      if (!hasMinor(a)) return false
      if (annualIncome === null) return false
      const fpl = getFPL(a.householdSize)
      // Medicaid covers up to 138% FPL; CHIP picks up from there to ~300%
      return annualIncome <= fpl * 3.0
    },
  },
  {
    id: 'aca',
    nameKey: 'prog_aca_name',
    fullKey: 'prog_aca_full',
    descKey: 'prog_aca_desc',
    whyKey:  'prog_aca_why',
    category: 'health',
    icon: '💊',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    estimatedAnnual: () => 5400,
    renewalMonths: 12,
    applicationUrl: 'https://www.healthcare.gov/apply-and-enroll/how-to-apply/',
    documents: ['Social Security numbers', 'Proof of income', 'Employer health plan information (if offered)'],
    check: (a) => {
      const annualIncome = getAnnualIncome(a)
      if (onMedicaid(a) || onMedicare(a)) return false
      if (a.healthCoverage === 'employer' || a.healthCoverage === 'marketplace') return false
      if (!isCitizenEligible(a)) return false
      if (annualIncome === null) return false
      const fpl = getFPL(a.householdSize)
      // ACA subsidies: 100%–400% FPL (enhanced subsidies extend higher)
      return annualIncome >= fpl * 1.0 && annualIncome <= fpl * 4.0
    },
  },
  {
    id: 'medicare_savings',
    nameKey: 'prog_medicare_savings_name',
    fullKey: 'prog_medicare_savings_full',
    descKey: 'prog_medicare_savings_desc',
    whyKey:  'prog_medicare_savings_why',
    category: 'health',
    icon: '🏥',
    color: '#0369a1',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
    estimatedAnnual: () => 2000,
    renewalMonths: 12,
    applicationUrl: 'https://www.medicare.gov/your-medicare-costs/get-help-paying-costs/medicare-savings-programs',
    documents: ['Medicare card', 'Proof of income', 'Bank statements', 'Social Security number'],
    check: (a) => {
      const annualIncome = getAnnualIncome(a)
      if (!hasSenior(a)) return false
      if (!isCitizenEligible(a)) return false
      if (annualIncome === null) return false
      // Medicare Savings Programs: income up to 135% FPL
      const fplLimit = getFPL(a.householdSize) * 1.35
      return annualIncome <= fplLimit
    },
  },

  // ── FINANCIAL ────────────────────────────────────────────────────────────
  {
    id: 'eitc',
    nameKey: 'prog_eitc_name',
    fullKey: 'prog_eitc_full',
    descKey: 'prog_eitc_desc',
    whyKey:  'prog_eitc_why',
    category: 'financial',
    icon: '💰',
    color: '#059669',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    estimatedAnnual: (size, income, a) => {
      const numChildren = [hasYoungChild(a), hasSchoolChild(a), hasTeen(a)].filter(Boolean).length
      if (numChildren === 0) return 632
      if (numChildren === 1) return 3995
      if (numChildren === 2) return 6604
      return 7430
    },
    renewalMonths: 12,
    applicationUrl: 'https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/claim-eitc',
    documents: ['W-2 forms or 1099s', 'Social Security numbers for you and children', 'Bank account info for direct deposit'],
    check: (a) => {
      const annual = getAnnualIncome(a)
      if (!isEmployed(a)) return false
      if (!isCitizenEligible(a)) return false
      if (annual === null) return false
      const hasKids = hasMinor(a)
      // 2024 EITC income limits
      if (!hasKids && annual <= 18591) return true
      if (hasKids && annual <= 56838) return true
      return false
    },
  },
  {
    id: 'ssi',
    nameKey: 'prog_ssi_name',
    fullKey: 'prog_ssi_full',
    descKey: 'prog_ssi_desc',
    whyKey:  'prog_ssi_why',
    category: 'financial',
    icon: '🛡️',
    color: '#4f46e5',
    bgColor: '#eef2ff',
    borderColor: '#c7d2fe',
    estimatedAnnual: () => 10572,
    timeToBenefit: '4–12 weeks (medical review)',
    difficulty: 'High',
    renewalMonths: 12,
    applicationUrl: 'https://www.ssa.gov/ssi/apply.htm',
    documents: ['Birth certificate or proof of age', 'Social Security card', 'Proof of citizenship', 'Bank statements', 'Medical records (for disability)'],
    check: (a) => {
      const annualIncome = getAnnualIncome(a)
      if (onSSI(a)) return false
      if (!isCitizenEligible(a)) return false
      const qualifies = hasSenior(a) || hasDisabled(a)
      if (!qualifies) return false
      if (annualIncome === null) return false
      // SSI income limit: $1,971/month (2024)
      return annualIncome <= 1971 * 12
    },
  },
  {
    id: 'tanf',
    nameKey: 'prog_tanf_name',
    fullKey: 'prog_tanf_full',
    descKey: 'prog_tanf_desc',
    whyKey:  'prog_tanf_why',
    category: 'financial',
    icon: '💵',
    color: '#b45309',
    bgColor: '#fef3c7',
    borderColor: '#fcd34d',
    estimatedAnnual: () => 5400,
    renewalMonths: 12,
    applicationUrl: 'https://www.acf.hhs.gov/ofa/map/about-tanf',
    documents: ['ID for all adults', 'Birth certificates for children', 'Proof of income', 'Proof of residence', 'Social Security numbers'],
    check: (a) => {
      const annualIncome = getAnnualIncome(a)
      // TANF: families with children, not employed, very low income
      if (!hasMinor(a)) return false
      if (isEmployed(a)) return false
      if (!isCitizenEligible(a)) return false
      if (annualIncome === null) return false
      const fplLimit = getFPL(a.householdSize) * 0.60
      return annualIncome <= fplLimit
    },
  },
  {
    id: 'unemployment',
    nameKey: 'prog_unemployment_name',
    fullKey: 'prog_unemployment_full',
    descKey: 'prog_unemployment_desc',
    whyKey:  'prog_unemployment_why',
    category: 'financial',
    icon: '📄',
    color: '#0ea5a4',
    bgColor: '#ecfeff',
    borderColor: '#bbf7d0',
    estimatedAnnual: () => 6000,
    timeToBenefit: '2–6 weeks',
    difficulty: 'Medium',
    renewalMonths: 12,
    applicationUrl: 'https://www.careeronestop.org/LocalHelp/UnemploymentBenefits/unemployment-benefits-find-help.aspx',
    documents: ['ID, recent pay stubs, employer information, reason for job separation'],
    check: (a) => {
      // Basic signal: recently unemployed or unemployed
      return isUnemployed(a)
    },
  },
  {
    id: 'ctc',
    nameKey: 'prog_ctc_name',
    fullKey: 'prog_ctc_full',
    descKey: 'prog_ctc_desc',
    whyKey:  'prog_ctc_why',
    category: 'financial',
    icon: '🧾',
    color: '#0f766e',
    bgColor: '#f0fdfa',
    borderColor: '#99f6e4',
    estimatedAnnual: (size, income, a) => {
      const count = [hasInfant(a), hasToddler(a), hasSchoolChild(a), hasTeen(a)].filter(Boolean).length * 2000
      return count
    },
    renewalMonths: 12,
    applicationUrl: 'https://www.irs.gov/credits-deductions/individuals/child-tax-credit',
    documents: ['Social Security numbers for all children', 'Tax return (Form 1040)', 'Proof of child residency'],
    check: (a) => {
      // Child Tax Credit: children under 17, income < $400k (single), effectively everyone with kids
      if (!hasMinor(a)) return false
      // Must have some earned income or file taxes
      const annual = getAnnualIncome(a)
      if (annual === null) return false
      return annual <= 200000 // single/HOH phase-out
    },
  },
  {
    id: 'vita',
    nameKey: 'prog_vita_name',
    fullKey: 'prog_vita_full',
    descKey: 'prog_vita_desc',
    whyKey:  'prog_vita_why',
    category: 'financial',
    icon: '📋',
    color: '#374151',
    bgColor: '#f9fafb',
    borderColor: '#e5e7eb',
    estimatedAnnual: () => 300,
    timeToBenefit: 'Same week (seasonal)',
    difficulty: 'Low',
    renewalMonths: 12,
    applicationUrl: 'https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers',
    documents: ['Government-issued ID', 'Social Security cards for all household members', 'All income documents (W-2, 1099)', 'Bank account info'],
    check: (a) => {
      const annualIncome = getAnnualIncome(a)
      if (annualIncome === null) return false
      // VITA: free tax prep for income < $67,000
      return annualIncome <= 67000
    },
  },

  // ── HOUSING ──────────────────────────────────────────────────────────────
  {
    id: 'section8',
    nameKey: 'prog_section8_name',
    fullKey: 'prog_section8_full',
    descKey: 'prog_section8_desc',
    whyKey:  'prog_section8_why',
    category: 'housing',
    icon: '🏠',
    color: '#db2777',
    bgColor: '#fdf2f8',
    borderColor: '#fbcfe8',
    estimatedAnnual: () => 9600,
    timeToBenefit: 'Months–Years (waitlist)',
    difficulty: 'High',
    renewalMonths: 12,
    waitlist: true,
    applicationUrl: 'https://www.hud.gov/topics/housing_choice_voucher_program_section_8',
    documents: ['Government-issued ID', 'Social Security cards', 'Proof of income', 'Rental history', 'Birth certificates'],
    check: (a) => {
      const annualIncome = getAnnualIncome(a)
      if (annualIncome === null) return false
      if (onHousing(a)) return false
      if (!isCitizenEligible(a)) return false
      // Section 8: income < 50% AMI. Using 50% FPL as approximation.
      const fplLimit = getFPL(a.householdSize) * 0.50
      const incomeQualifies = annualIncome <= fplLimit
      // Priority for homeless, disabled, elderly, veterans
      const priorityFlag = isHomeless(a) || hasDisabled(a) || hasSenior(a) || hasVeteran(a)
      // Also qualify at 80% FPL with priority factors
      const extendedLimit = getFPL(a.householdSize) * 0.80
      return incomeQualifies || (priorityFlag && annualIncome <= extendedLimit)
    },
  },
  {
    id: 'era',
    nameKey: 'prog_era_name',
    fullKey: 'prog_era_full',
    descKey: 'prog_era_desc',
    whyKey:  'prog_era_why',
    category: 'housing',
    icon: '🏘️',
    color: '#be185d',
    bgColor: '#fdf4ff',
    borderColor: '#f0abfc',
    estimatedAnnual: () => 3600,
    timeToBenefit: '2–8 weeks',
    difficulty: 'Medium',
    renewalMonths: 6,
    applicationUrl: 'https://home.treasury.gov/policy-issues/coronavirus/assistance-for-state-local-and-tribal-governments/emergency-rental-assistance-program',
    documents: ['Lease agreement', 'Proof of income', 'Government-issued ID', 'Proof of housing instability (eviction notice, past-due rent)'],
    check: (a) => {
      const annualIncome = getAnnualIncome(a)
      if (annualIncome === null) return false
      // ERA: experiencing housing instability, income < 80% AMI (~80% FPL)
      if (!isHomeless(a) && a.housingStatus !== 'renting') return false
      const fplLimit = getFPL(a.householdSize) * 0.80
      return annualIncome <= fplLimit
    },
  },

  // ── ENERGY ───────────────────────────────────────────────────────────────
  {
    id: 'liheap',
    nameKey: 'prog_liheap_name',
    fullKey: 'prog_liheap_full',
    descKey: 'prog_liheap_desc',
    whyKey:  'prog_liheap_why',
    category: 'energy',
    icon: '💡',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    estimatedAnnual: () => 600,
    renewalMonths: 12,
    applicationUrl: 'https://www.acf.hhs.gov/ocs/map/liheap-state-and-territory-contact-listing',
    documents: ['Proof of income', 'Recent utility bills', 'ID for all household members', 'Social Security numbers'],
    check: (a) => {
      const annualIncome = getAnnualIncome(a)
      if (annualIncome === null) return false
      const fplLimit = getFPL(a.householdSize) * 1.50
      return annualIncome <= fplLimit
    },
  },
  {
    id: 'lifeline',
    nameKey: 'prog_lifeline_name',
    fullKey: 'prog_lifeline_full',
    descKey: 'prog_lifeline_desc',
    whyKey:  'prog_lifeline_why',
    category: 'financial',
    icon: '📱',
    color: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
    estimatedAnnual: () => 180,
    renewalMonths: 12,
    applicationUrl: 'https://www.lifelinesupport.org/do-i-qualify/',
    documents: ['Government-issued ID', 'Proof of income OR proof of program participation (SNAP, Medicaid, SSI card)'],
    check: (a) => {
      // Lifeline: income < 135% FPL OR already on SNAP/Medicaid/SSI/VA pension/Federal housing
      const onQualifyingProgram = onSNAP(a) || onMedicaid(a) || onSSI(a) || onHousing(a)
      if (onQualifyingProgram) return true
      const annualIncome = getAnnualIncome(a)
      if (annualIncome === null) return false
      const fplLimit = getFPL(a.householdSize) * 1.35
      return annualIncome <= fplLimit
    },
  },

  // ── EDUCATION & CHILDCARE ────────────────────────────────────────────────
  {
    id: 'headstart',
    nameKey: 'prog_headstart_name',
    fullKey: 'prog_headstart_full',
    descKey: 'prog_headstart_desc',
    whyKey:  'prog_headstart_why',
    category: 'education',
    icon: '📚',
    color: '#ea580c',
    bgColor: '#fff7ed',
    borderColor: '#fed7aa',
    estimatedAnnual: () => 10500,
    renewalMonths: 12,
    applicationUrl: 'https://eclkc.ohs.acf.hhs.gov/center-locator',
    documents: ['Child\'s birth certificate', 'Proof of income', 'Immunization records', 'Proof of residence'],
    check: (a) => {
      // Head Start: children 3-4 (toddler range), income < 100% FPL
      // Early Head Start: infants and toddlers under 3
      if (!hasToddler(a) && !hasInfant(a)) return false
      const annualIncome = getAnnualIncome(a)
      if (annualIncome === null) return false
      const fplLimit = getFPL(a.householdSize) * 1.30
      return annualIncome <= fplLimit
    },
  },
  {
    id: 'ccdf',
    nameKey: 'prog_ccdf_name',
    fullKey: 'prog_ccdf_full',
    descKey: 'prog_ccdf_desc',
    whyKey:  'prog_ccdf_why',
    category: 'education',
    icon: '🧒',
    color: '#c026d3',
    bgColor: '#fdf4ff',
    borderColor: '#e879f9',
    estimatedAnnual: () => 6000,
    renewalMonths: 12,
    applicationUrl: 'https://childcareta.acf.hhs.gov/consumer-education',
    documents: ['Child\'s birth certificate', 'Proof of income', 'Proof of work, school, or training', 'Child care provider information'],
    check: (a) => {
      // CCDF: children under 13, parent working/in school/training, income < 85% state median (~250% FPL approx)
      const hasEligibleChild = hasInfant(a) || hasToddler(a) || hasSchoolChild(a)
      if (!hasEligibleChild) return false
      const isWorking = isEmployed(a) || isStudent(a) || a.employment === 'recently_unemployed'
      if (!isWorking) return false
      const annualIncome = getAnnualIncome(a)
      if (annualIncome === null) return false
      const fplLimit = getFPL(a.householdSize) * 2.50
      return annualIncome <= fplLimit
    },
  },

  // ── EMPLOYMENT ───────────────────────────────────────────────────────────
  {
    id: 'wioa',
    nameKey: 'prog_wioa_name',
    fullKey: 'prog_wioa_full',
    descKey: 'prog_wioa_desc',
    whyKey:  'prog_wioa_why',
    category: 'financial',
    icon: '🎓',
    color: '#1d4ed8',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    estimatedAnnual: () => 4000,
    renewalMonths: 12,
    applicationUrl: 'https://www.careeronestop.org/LocalHelp/service-locator.aspx',
    documents: ['Government-issued ID', 'Proof of income or unemployment', 'Social Security number'],
    check: (a) => {
      // WIOA: unemployed or low-income adults seeking job training
      if (!isUnemployed(a) && !isStudent(a)) return false
      const annualIncome = getAnnualIncome(a)
      if (annualIncome === null) return false
      const fplLimit = getFPL(a.householdSize) * 1.75
      return annualIncome <= fplLimit
    },
  },

  // ── VETERANS ─────────────────────────────────────────────────────────────
  {
    id: 'va_benefits',
    nameKey: 'prog_va_name',
    fullKey: 'prog_va_full',
    descKey: 'prog_va_desc',
    whyKey:  'prog_va_why',
    category: 'health',
    icon: '🎖️',
    color: '#1e3a5f',
    bgColor: '#f0f4ff',
    borderColor: '#c7d2fe',
    estimatedAnnual: () => 8000,
    renewalMonths: 12,
    applicationUrl: 'https://www.va.gov/health-care/how-to-apply/',
    documents: ['DD-214 (discharge papers)', 'Government-issued ID', 'Social Security number', 'Insurance information'],
    check: (a) => {
      // VA benefits: any veteran, no income limit for basic healthcare
      return hasVeteran(a)
    },
  },
]
