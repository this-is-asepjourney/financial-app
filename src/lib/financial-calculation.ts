/**
 * FINANCIAL HEALTH CALCULATOR
 * Berdasarkan teori keuangan yang teruji dari pakar:
 */

export interface FinancialData {
    // Income & Expenses
    monthlyIncome: number
    monthlyExpenses: number
    needsExpenses: number // 50% untuk kebutuhan
    wantsExpenses: number // 30% untuk keinginan

    // Savings
    totalSavings: number
    emergencyFund: number
    monthlySavings: number

    // Debt
    totalDebt: number
    monthlyDebtPayments: number
    creditCardDebt: number

    // Assets & Investments
    totalAssets: number
    investments: number
    retirementSavings: number

    // Insurance & Protection
    hasHealthInsurance: boolean
    hasLifeInsurance: boolean
    hasDisabilityInsurance: boolean

    // Planning
    hasBudget: boolean
    hasFinancialPlan: boolean
    hasRetirementPlan: boolean
    hasWill: boolean
    
    // Budgets
    budgets: { amount: number; spent: number }[]
}

export interface FinancialHealthResult {
    overallScore: number
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'

    savingsRate: {
        score: number
        value: number
        status: string
    }
    emergencyFund: {
        score: number
        value: number
        status: string
    }
    dti: {
        score: number
        value: number
        status: string
    }
    budgetAdherence: {
        score: number
        value: number
        status: string
    }
    investmentRatio: {
        score: number
        value: number
        status: string
    }
}

function scoreSavingsRate(rate: number): number {
    if (rate >= 0.20) return 100;
    if (rate >= 0.10) return 60 + ((rate - 0.10) / 0.10) * 40;
    if (rate >= 0) return 30 + (rate / 0.10) * 30;
    return 0;
}

function scoreEmergencyFund(months: number): number {
    if (months >= 6) return 100;
    if (months >= 3) return 70 + ((months - 3) / 3) * 30;
    if (months >= 1) return 30 + ((months - 1) / 2) * 40;
    return Math.max(0, (months / 1) * 30);
}

function scoreDTI(dti: number): number {
    if (dti <= 0) return 100;
    if (dti <= 0.20) return 100 - (dti / 0.20) * 20;
    if (dti <= 0.36) return 80 - ((dti - 0.20) / 0.16) * 20;
    if (dti <= 0.43) return 60 - ((dti - 0.36) / 0.07) * 30;
    return Math.max(0, 30 - ((dti - 0.43) / 0.20) * 30);
}

function scoreBudgetAdherence(budgets: { amount: number; spent: number }[]): number {
    const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
    if (totalBudget === 0) return 50; // netral jika belum ada budget dibuat
    const overspend = budgets.reduce((s, b) => s + Math.max(0, b.spent - b.amount), 0);
    const ratio = overspend / totalBudget;
    return Math.max(0, 100 - ratio * 100);
}

function scoreInvestmentRatio(ratio: number): number {
    if (ratio >= 0.30) return 100;
    if (ratio >= 0.10) return 50 + ((ratio - 0.10) / 0.20) * 50;
    if (ratio > 0) return 20 + (ratio / 0.10) * 30;
    return 20;
}

const WEIGHTS = {
    savingsRate: 0.30,
    emergencyFund: 0.25,
    dti: 0.20,
    budgetAdherence: 0.15,
    investmentRatio: 0.10,
};

export function calculateFinHealthScore(data: FinancialData): FinancialHealthResult {
    const savingsRateVal = data.monthlyIncome > 0 ? (data.monthlyIncome - data.monthlyExpenses) / data.monthlyIncome : 0;
    const emergencyFundMonthsVal = data.monthlyExpenses > 0 ? data.emergencyFund / data.monthlyExpenses : 0;
    const dtiVal = data.monthlyIncome > 0 ? data.monthlyDebtPayments / data.monthlyIncome : 0;
    const budgetsVal = data.budgets || [];
    
    const totalLiquid = data.emergencyFund; // cash/bank
    const investmentRatioVal = data.investments + totalLiquid > 0 ? data.investments / (data.investments + totalLiquid) : 0;

    const s1 = scoreSavingsRate(savingsRateVal);
    const s2 = scoreEmergencyFund(emergencyFundMonthsVal);
    const s3 = scoreDTI(dtiVal);
    const s4 = scoreBudgetAdherence(budgetsVal);
    const s5 = scoreInvestmentRatio(investmentRatioVal);

    const overallScore = Math.round(
        s1 * WEIGHTS.savingsRate +
        s2 * WEIGHTS.emergencyFund +
        s3 * WEIGHTS.dti +
        s4 * WEIGHTS.budgetAdherence +
        s5 * WEIGHTS.investmentRatio
    );

    return {
        overallScore,
        status: getFinancialStatus(overallScore),
        savingsRate: {
            score: Math.round(s1),
            value: savingsRateVal,
            status: getDimensionStatus(s1)
        },
        emergencyFund: {
            score: Math.round(s2),
            value: emergencyFundMonthsVal,
            status: getDimensionStatus(s2)
        },
        dti: {
            score: Math.round(s3),
            value: dtiVal,
            status: getDimensionStatus(s3)
        },
        budgetAdherence: {
            score: Math.round(s4),
            value: budgetsVal.length > 0 ? 1 - (s4 / 100) : 0, // ini hanya aproksimasi
            status: getDimensionStatus(s4)
        },
        investmentRatio: {
            score: Math.round(s5),
            value: investmentRatioVal,
            status: getDimensionStatus(s5)
        }
    };
}

/**
 * Get dimension status
 */
function getDimensionStatus(score: number): string {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Poor'
}

/**
 * Get overall financial health status
 */
function getFinancialStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (score >= 80) return 'excellent'
    if (score >= 65) return 'good'
    if (score >= 50) return 'fair'
    if (score >= 35) return 'poor'
    return 'critical'
}

/**
 * 50/30/20 RULE CALCULATOR
 * Elizabeth Warren's budgeting rule
 */
export function calculate503020Rule(monthlyIncome: number) {
    return {
        needs: monthlyIncome * 0.5,    // 50% untuk kebutuhan
        wants: monthlyIncome * 0.3,    // 30% untuk keinginan
        savings: monthlyIncome * 0.2,  // 20% untuk tabungan/investasi
        breakdown: {
            needs: 'Sewa/hipotek, utilitas, makanan, transportasi, asuransi, pembayaran minimum utang',
            wants: 'Hiburan, makan di luar, hobi, liburan, belanja non-esensial',
            savings: 'Dana darurat, investasi, tabungan pensiun, pelunasan utang tambahan',
        },
    }
}

/**
 * EMERGENCY FUND CALCULATOR
 * Berdasarkan rekomendasi Dave Ramsey & Suze Orman
 */
export function calculateEmergencyFundTarget(
    monthlyExpenses: number,
    riskProfile: 'low' | 'medium' | 'high' = 'medium'
) {
    const monthsMap = {
        low: { min: 3, ideal: 6 },       // Stabil (PNS, pekerjaan tetap)
        medium: { min: 6, ideal: 9 },     // Moderate (profesional, freelancer mapan)
        high: { min: 9, ideal: 12 },      // High risk (freelancer baru, industri tidak stabil)
    }

    const target = monthsMap[riskProfile]

    return {
        minimum: monthlyExpenses * target.min,
        ideal: monthlyExpenses * target.ideal,
        monthlyContribution: monthlyExpenses * 0.2, // Rekomendasi sisihkan 20% untuk dana darurat
        timeToReachMinimum: Math.ceil(target.min / 0.2), // Bulan untuk mencapai minimum
    }
}

/**
 * DEBT-TO-INCOME RATIO (DTI) CALCULATOR
 * Standar yang digunakan oleh bank dan lembaga keuangan
 */
export function calculateDTI(
    monthlyDebtPayments: number,
    monthlyIncome: number
) {
    const dti = (monthlyDebtPayments / monthlyIncome) * 100

    let status = ''
    let maxBorrowingCapacity = 0
    let recommendation = ''

    if (dti <= 28) {
        status = 'Excellent'
        maxBorrowingCapacity = monthlyIncome * 0.36 - monthlyDebtPayments
        recommendation = 'DTI sangat sehat. Anda memenuhi syarat untuk sebagian besar pinjaman'
    } else if (dti <= 36) {
        status = 'Good'
        maxBorrowingCapacity = monthlyIncome * 0.36 - monthlyDebtPayments
        recommendation = 'DTI dalam batas sehat. Pertahankan dan hindari utang baru'
    } else if (dti <= 43) {
        status = 'Fair'
        maxBorrowingCapacity = monthlyIncome * 0.43 - monthlyDebtPayments
        recommendation = 'DTI mulai tinggi. Fokus pada pelunasan utang sebelum mengambil pinjaman baru'
    } else if (dti <= 50) {
        status = 'Poor'
        maxBorrowingCapacity = 0
        recommendation = 'DTI tinggi. Prioritaskan pelunasan utang. Hindari utang baru'
    } else {
        status = 'Critical'
        maxBorrowingCapacity = 0
        recommendation = 'DTI kritis! Segera konsultasi dengan financial advisor untuk restrukturisasi utang'
    }

    return {
        dti,
        status,
        maxBorrowingCapacity,
        recommendation,
        industryStandards: {
            frontEndDTI: '≤28% (biaya perumahan)',
            backEndDTI: '≤36% (total utang)',
            fhaLoan: '≤43% (maksimum untuk FHA loan)',
            conventional: '≤36-43% (tergantung lender)',
        },
    }
}

/**
 * NET WORTH CALCULATOR
 * Formula standar yang digunakan financial planner
 */
export function calculateNetWorth(
    assets: {
        liquid: number      // Cash, savings, checking
        investments: number  // Stocks, bonds, mutual funds
        retirement: number   // 401k, IRA, pension
        realEstate: number   // Property value
        other: number        // Vehicle, jewelry, etc.
    },
    liabilities: {
        mortgage: number
        carLoan: number
        studentLoan: number
        creditCard: number
        otherDebts: number
    }
) {
    const totalAssets = Object.values(assets).reduce((a, b) => a + b, 0)
    const totalLiabilities = Object.values(liabilities).reduce((a, b) => a + b, 0)
    const netWorth = totalAssets - totalLiabilities

    // Net worth targets by age (The Millionaire Next Door formula)
    // Target Net Worth = (Age × Annual Income) / 10
    const ageTarget = 30 // Default, should be provided
    const annualIncome = 0 // Should be provided

    return {
        totalAssets,
        totalLiabilities,
        netWorth,
        isPositive: netWorth > 0,
        liquidityRatio: totalAssets > 0 ? (assets.liquid / totalAssets) * 100 : 0,
        debtToAssetRatio: totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0,
        targetNetWorth: (ageTarget * annualIncome) / 10, // Stanley & Danko formula
    }
}

/**
 * RETIREMENT READINESS CALCULATOR
 * Berdasarkan 4% Rule (Bengen) & Trinity Study
 */
export function calculateRetirementReadiness(
    currentAge: number,
    retirementAge: number,
    currentRetirementSavings: number,
    monthlyContribution: number,
    expectedAnnualReturn: number = 7, // Historical S&P 500 return
    inflationRate: number = 3
) {
    const yearsToRetirement = retirementAge - currentAge
    const realReturn = expectedAnnualReturn - inflationRate

    // Future value of current savings
    const futureValueCurrent = currentRetirementSavings *
        Math.pow(1 + realReturn / 100, yearsToRetirement)

    // Future value of monthly contributions
    const monthlyRate = realReturn / 100 / 12
    const totalMonths = yearsToRetirement * 12
    const futureValueContributions = monthlyContribution *
        ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)

    const totalAtRetirement = futureValueCurrent + futureValueContributions

    // 4% rule: annual withdrawal = 4% of portfolio
    const sustainableAnnualWithdrawal = totalAtRetirement * 0.04

    return {
        totalAtRetirement,
        sustainableMonthlyWithdrawal: sustainableAnnualWithdrawal / 12,
        yearsToRetirement,
        isOnTrack: sustainableAnnualWithdrawal > 0, // Should compare with desired retirement income
        recommendation: yearsToRetirement < 30
            ? 'Mulai menabung lebih agresif untuk pensiun'
            : 'Anda masih punya waktu, tapi mulai sekarang untuk hasil maksimal',
    }
}

/**
 * GENERATE COMPREHENSIVE FINANCIAL REPORT
 */
export function generateFinancialReport(data: FinancialData) {
    const finHealth = calculateFinHealthScore(data)
    const rule503020 = calculate503020Rule(data.monthlyIncome)
    const emergencyFund = calculateEmergencyFundTarget(data.monthlyExpenses)
    const dti = calculateDTI(data.monthlyDebtPayments, data.monthlyIncome)

    const summary = {
        overallHealth: finHealth.status,
        score: finHealth.overallScore,
        keyFindings: [] as string[],
        urgentActions: [] as string[],
        strengths: [] as string[],
    }

    // Key findings
    if (data.monthlyExpenses > data.monthlyIncome) {
        summary.urgentActions.push('⚠️ Pengeluaran melebihi pemasukan! Segera buat budget')
    }

    if (finHealth.emergencyFund.value < 3) {
        summary.urgentActions.push('⚠️ Dana darurat kurang dari 3 bulan')
    }

    if (finHealth.dti.value > 43) {
        summary.urgentActions.push('⚠️ DTI di atas 43%, prioritaskan pelunasan utang')
    }

    if (data.monthlyExpenses <= data.monthlyIncome) {
        summary.strengths.push('✅ Hidup sesuai kemampuan (pengeluaran tidak melebihi pendapatan)')
    }

    if (finHealth.savingsRate.value >= 20) {
        summary.strengths.push('✅ Tabungan rate di atas 20%')
    }

    return {
        finHealth,
        rule503020,
        emergencyFund,
        dti,
        summary,
        generatedAt: new Date().toISOString(),
    }
}