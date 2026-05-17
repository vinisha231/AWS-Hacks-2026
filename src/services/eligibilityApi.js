// src/services/eligibilityApi.js
export async function fetchEligibility(householdSize, annualIncome) {
  // MOCK DATA – replace with real Lambda call later
  // This simulates the response from your future backend
  return {
    totalEstimate: 6600,
    programs: [
      {
        id: 'chip',
        name: 'CHIP',
        category: 'Health',
        estimatedValue: 4800,
        sources: [
          'https://www.medicaid.gov/chip/index.html',
          'https://www.hhs.texas.gov/services/health/childrens-health-insurance-program-chip'
        ]
      },
      {
        id: 'wic',
        name: 'WIC',
        category: 'Food',
        estimatedValue: 1800,
        sources: [
          'https://www.fns.usda.gov/wic',
          'https://texaswic.org/'
        ]
      }
    ]
  };
}