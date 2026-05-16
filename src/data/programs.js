// 2024 Federal Poverty Level
const FPL = { 1: 15060, 2: 20440, 3: 25820, 4: 31200, 5: 36580, 6: 41960, 7: 47340, 8: 52720 }

export function getFPL(size) {
  const s = Math.max(1, Math.min(8, size))
  if (size <= 8) return FPL[s]
  return FPL[8] + (size - 8) * 5380
}

// Monthly income midpoints for each bracket
export const INCOME_BRACKETS = {
  'Under $1,000':   500,
  '$1,000 – $1,500': 1250,
  '$1,500 – $2,000': 1750,
  '$2,000 – $2,500': 2250,
  '$2,500 – $3,500': 3000,
  '$3,500 – $5,000': 4250,
  'Over $5,000':    6000,
  'I prefer not to say': 2500,
}

export const PROGRAMS = [
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
    estimatedAnnual: (size, income) => {
      // Rough SNAP benefit estimate
      const monthly = Math.max(0, Math.min(1756, 281 + (size - 1) * 155 - income * 0.3))
      return Math.round(monthly * 12 / 100) * 100
    },
    renewalMonths: 12,
    applicationUrl: 'https://www.fns.usda.gov/snap/state-directory',
    documents: ['Government-issued ID', 'Proof of income (pay stubs, tax return)', 'Proof of residence (lease, utility bill)', 'Social Security numbers for all household members'],
    check: ({ householdSize, monthlyIncome, currentBenefits }) => {
      if (currentBenefits?.includes('snap')) return false
      const annual = getFPL(householdSize) * 1.30
      return monthlyIncome * 12 <= annual
    },
  },
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
    renewalMonths: 12,
    applicationUrl: 'https://www.healthcare.gov/medicaid-chip/getting-medicaid-chip/',
    documents: ['Government-issued ID', 'Proof of income', 'Proof of citizenship or immigration status', 'Social Security number'],
    check: ({ householdSize, monthlyIncome, currentBenefits }) => {
      if (currentBenefits?.includes('medicaid')) return false
      const annual = getFPL(householdSize) * 1.38
      return monthlyIncome * 12 <= annual
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
    check: ({ householdSize, monthlyIncome, situation, currentBenefits }) => {
      if (currentBenefits?.includes('medicaid')) return false
      const hasChildren = situation?.includes('school') || situation?.includes('infants')
      if (!hasChildren) return false
      const annual = getFPL(householdSize) * 2.0
      return monthlyIncome * 12 <= annual
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
    renewalMonths: 6,
    applicationUrl: 'https://www.fns.usda.gov/wic/wic-how-apply',
    documents: ['ID for each applicant', 'Proof of income', 'Proof of residence', 'Proof of pregnancy or child\'s birth certificate'],
    check: ({ householdSize, monthlyIncome, situation }) => {
      const qualifies = situation?.includes('pregnant') || situation?.includes('infants')
      if (!qualifies) return false
      const annual = getFPL(householdSize) * 1.85
      return monthlyIncome * 12 <= annual
    },
  },
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
    check: ({ householdSize, monthlyIncome }) => {
      const annual = getFPL(householdSize) * 1.50
      return monthlyIncome * 12 <= annual
    },
  },
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
    renewalMonths: 12,
    waitlist: true,
    applicationUrl: 'https://www.hud.gov/topics/housing_choice_voucher_program_section_8',
    documents: ['Government-issued ID', 'Social Security cards', 'Proof of income', 'Rental history', 'Birth certificates'],
    check: ({ householdSize, monthlyIncome, situation, currentBenefits }) => {
      if (currentBenefits?.includes('housing')) return false
      const annual = getFPL(householdSize) * 1.50
      const housingFlag = situation?.includes('housing')
      return monthlyIncome * 12 <= annual || housingFlag
    },
  },
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
    estimatedAnnual: (size, income, situation) => {
      const children = situation?.includes('school') || situation?.includes('infants') ? 2 : 0
      if (children === 0) return 538
      if (children === 1) return 3995
      return 6604
    },
    renewalMonths: 12,
    applicationUrl: 'https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/claim-eitc',
    documents: ['W-2 forms or 1099s', 'Social Security numbers', 'Bank account info for direct deposit', 'Prior year tax return (if applicable)'],
    check: ({ householdSize, monthlyIncome, situation }) => {
      const hasChildren = situation?.includes('school') || situation?.includes('infants')
      const isEmployed = situation?.includes('employed')
      if (!isEmployed) return false
      const annual = monthlyIncome * 12
      if (!hasChildren && annual <= 17640) return true
      if (hasChildren && annual <= 52918) return true
      return false
    },
  },
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
    check: ({ householdSize, monthlyIncome, situation }) => {
      if (!situation?.includes('infants')) return false
      const annual = getFPL(householdSize) * 1.30
      return monthlyIncome * 12 <= annual
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
    estimatedAnnual: () => 800,
    renewalMonths: 12,
    applicationUrl: 'https://www.fns.usda.gov/nslp',
    documents: ['Completed school meal application', 'Proof of income (or SNAP/Medicaid enrollment letter)'],
    check: ({ householdSize, monthlyIncome, situation }) => {
      if (!situation?.includes('school')) return false
      const annual = getFPL(householdSize) * 1.85
      return monthlyIncome * 12 <= annual
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
    renewalMonths: 12,
    applicationUrl: 'https://www.ssa.gov/ssi/apply.htm',
    documents: ['Birth certificate or proof of age', 'Social Security card', 'Proof of citizenship', 'Bank statements', 'Medical records (for disability)'],
    check: ({ householdSize, monthlyIncome, situation, currentBenefits }) => {
      if (currentBenefits?.includes('ssi')) return false
      const qualifies = situation?.includes('senior') || situation?.includes('disability')
      if (!qualifies) return false
      return monthlyIncome <= 1971
    },
  },
]
