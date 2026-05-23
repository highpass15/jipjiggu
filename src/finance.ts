export type MortgageRuleProfile = {
  ltvRatio: number
  priceCapEok: number
  isRegulatedArea: boolean
  isCapitalRegion: boolean
  isFirstTimeHomeBuyer: boolean
}

export type FinancingPlan = {
  annualIncomeManwon: number
  assetsManwon: number
  existingDebtManwon: number
  estimatedExistingAnnualDebtManwon: number
  dsrRoomAnnualManwon: number
  dsrLimitLoanEok: number
  displayMaxPurchaseEok: number
  baseRatePercent: number
  stressRatePercent: number
  dsrCapPercent: number
  termYears: number
  assumedRegionLabel: string
  assumedRule: MortgageRuleProfile
  isFirstTimeHomeBuyer: boolean
  baseMonthlyPaymentManwon: number
  stressMonthlyPaymentManwon: number
}

export type CandidateMortgagePlan = {
  isAffordable: boolean
  loanEok: number
  cashNeededEok: number
  cashBufferEok: number
  monthlyPaymentManwon: number
  stressMonthlyPaymentManwon: number
  dsrPercent: number
  ltvPercent: number
  rule: MortgageRuleProfile
  isFirstTimeHomeBuyer: boolean
}

const mortgageAssumptions = {
  baseRatePercent: 4.8,
  stressAddRatePercent: 3,
  dsrCapPercent: 40,
  termYears: 30,
  existingDebtAnnualRepaymentRatio: 0.12,
}

const normalizeRegionText = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replaceAll('레미안', '래미안')
    .replaceAll('세트럴', '센트럴')

const calculateMonthlyPaymentManwon = (loanEok: number, annualRatePercent: number, termYears: number) => {
  if (loanEok <= 0) return 0

  const principalManwon = loanEok * 10000
  const monthlyRate = annualRatePercent / 100 / 12
  const months = termYears * 12

  if (monthlyRate <= 0) return principalManwon / months

  return principalManwon * (monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1)
}

const calculateLoanLimitEokFromMonthlyPayment = (
  monthlyPaymentManwon: number,
  annualRatePercent: number,
  termYears: number,
) => {
  if (monthlyPaymentManwon <= 0) return 0

  const monthlyRate = annualRatePercent / 100 / 12
  const months = termYears * 12

  if (monthlyRate <= 0) return (monthlyPaymentManwon * months) / 10000

  return (monthlyPaymentManwon * (1 - (1 + monthlyRate) ** -months) / monthlyRate) / 10000
}

const isCapitalRegionText = (regionText: string) => {
  const normalized = normalizeRegionText(regionText)
  return ['서울', '경기', '인천', '수도권'].some((keyword) => normalized.includes(normalizeRegionText(keyword)))
}

export const isSeoulRegionText = (regionText: string) =>
  normalizeRegionText(regionText).includes(normalizeRegionText('서울'))

const getMortgageRuleProfile = (
  regionText: string,
  priceEok: number,
  options: { isFirstTimeHomeBuyer?: boolean } = {},
): MortgageRuleProfile => {
  const normalized = normalizeRegionText(regionText)
  const isRegulatedArea = ['강남구', '서초구', '송파구', '용산구'].some((district) =>
    normalized.includes(normalizeRegionText(district)),
  )
  const isCapitalRegion = isCapitalRegionText(regionText)
  const isFirstTimeHomeBuyer = Boolean(options.isFirstTimeHomeBuyer)
  const firstTimeLtvRatio = isCapitalRegion ? 0.7 : 0.8

  return {
    ltvRatio: isFirstTimeHomeBuyer ? firstTimeLtvRatio : isRegulatedArea ? 0.4 : 0.7,
    priceCapEok: priceEok <= 15 ? 6 : priceEok <= 25 ? 4 : 2,
    isRegulatedArea,
    isCapitalRegion,
    isFirstTimeHomeBuyer,
  }
}

export const calculateCandidateMortgagePlan = (
  priceEok: number,
  regionText: string,
  financingPlan: Pick<
    FinancingPlan,
    | 'assetsManwon'
    | 'annualIncomeManwon'
    | 'estimatedExistingAnnualDebtManwon'
    | 'dsrLimitLoanEok'
    | 'baseRatePercent'
    | 'stressRatePercent'
    | 'termYears'
    | 'isFirstTimeHomeBuyer'
  >,
): CandidateMortgagePlan => {
  const rule = getMortgageRuleProfile(regionText, priceEok, {
    isFirstTimeHomeBuyer: financingPlan.isFirstTimeHomeBuyer,
  })
  const assetsEok = financingPlan.assetsManwon / 10000
  const ltvLimitEok = priceEok * rule.ltvRatio
  const loanEok = Math.max(0, Math.min(priceEok, financingPlan.dsrLimitLoanEok, ltvLimitEok, rule.priceCapEok))
  const cashNeededEok = Math.max(0, priceEok - loanEok)
  const cashBufferEok = assetsEok - cashNeededEok
  const monthlyPaymentManwon = calculateMonthlyPaymentManwon(
    loanEok,
    financingPlan.baseRatePercent,
    financingPlan.termYears,
  )
  const stressMonthlyPaymentManwon = calculateMonthlyPaymentManwon(
    loanEok,
    financingPlan.stressRatePercent,
    financingPlan.termYears,
  )
  const dsrPercent =
    financingPlan.annualIncomeManwon > 0
      ? ((stressMonthlyPaymentManwon * 12 + financingPlan.estimatedExistingAnnualDebtManwon) /
          financingPlan.annualIncomeManwon) *
        100
      : 0

  return {
    isAffordable: cashBufferEok >= -0.02,
    loanEok,
    cashNeededEok,
    cashBufferEok,
    monthlyPaymentManwon,
    stressMonthlyPaymentManwon,
    dsrPercent,
    ltvPercent: rule.ltvRatio * 100,
    rule,
    isFirstTimeHomeBuyer: financingPlan.isFirstTimeHomeBuyer,
  }
}

const calculateDisplayMaxPurchaseEok = (
  plan: Pick<
    FinancingPlan,
    | 'assetsManwon'
    | 'annualIncomeManwon'
    | 'estimatedExistingAnnualDebtManwon'
    | 'dsrLimitLoanEok'
    | 'baseRatePercent'
    | 'stressRatePercent'
    | 'termYears'
    | 'isFirstTimeHomeBuyer'
  >,
) => {
  let low = 0
  let high = 80

  for (let index = 0; index < 32; index += 1) {
    const mid = (low + high) / 2
    const mortgage = calculateCandidateMortgagePlan(mid, '수도권 비규제', plan)

    if (mortgage.isAffordable) {
      low = mid
    } else {
      high = mid
    }
  }

  return Math.max(0, low)
}

export const calculateFinancingPlan = ({
  incomeManwon,
  assetsManwon,
  debtManwon,
  isFirstTimeHomeBuyer,
}: {
  incomeManwon: number
  assetsManwon: number
  debtManwon: number
  isFirstTimeHomeBuyer: boolean
}): FinancingPlan => {
  const baseRatePercent = mortgageAssumptions.baseRatePercent
  const stressRatePercent = mortgageAssumptions.baseRatePercent + mortgageAssumptions.stressAddRatePercent
  const estimatedExistingAnnualDebtManwon = Math.max(
    0,
    debtManwon * mortgageAssumptions.existingDebtAnnualRepaymentRatio,
  )
  const dsrRoomAnnualManwon = Math.max(
    0,
    incomeManwon * (mortgageAssumptions.dsrCapPercent / 100) - estimatedExistingAnnualDebtManwon,
  )
  const dsrLimitLoanEok = calculateLoanLimitEokFromMonthlyPayment(
    dsrRoomAnnualManwon / 12,
    stressRatePercent,
    mortgageAssumptions.termYears,
  )
  const planBase = {
    assetsManwon,
    annualIncomeManwon: incomeManwon,
    estimatedExistingAnnualDebtManwon,
    dsrLimitLoanEok,
    baseRatePercent,
    stressRatePercent,
    termYears: mortgageAssumptions.termYears,
    isFirstTimeHomeBuyer,
  }
  const displayMaxPurchaseEok = calculateDisplayMaxPurchaseEok(planBase)
  const assumedRule = getMortgageRuleProfile('수도권 비규제', displayMaxPurchaseEok, { isFirstTimeHomeBuyer })
  const displayLoanEok = Math.min(
    dsrLimitLoanEok,
    assumedRule.priceCapEok,
    displayMaxPurchaseEok * assumedRule.ltvRatio,
  )

  return {
    ...planBase,
    existingDebtManwon: debtManwon,
    dsrRoomAnnualManwon,
    displayMaxPurchaseEok,
    dsrCapPercent: mortgageAssumptions.dsrCapPercent,
    assumedRegionLabel: '수도권 비규제·무주택/처분조건부 1주택 기준',
    assumedRule,
    isFirstTimeHomeBuyer,
    baseMonthlyPaymentManwon: calculateMonthlyPaymentManwon(
      displayLoanEok,
      baseRatePercent,
      mortgageAssumptions.termYears,
    ),
    stressMonthlyPaymentManwon: calculateMonthlyPaymentManwon(
      displayLoanEok,
      stressRatePercent,
      mortgageAssumptions.termYears,
    ),
  }
}
