/**
 * FINANCIAL HEALTH CALCULATOR
 * Berdasarkan teori keuangan yang teruji dari pakar:
 * 
 * 1. Financial Health Network (FinHealth Score®)
 * 2. 50/30/20 Rule - Elizabeth Warren
 * 3. Emergency Fund Theory - Dave Ramsey, Suze Orman
 * 4. Debt-to-Income Ratio (DTI) Standards
 * 5. Net Worth Calculation Standards
 * 6. Savings Rate Theory - Wade Pfau, FIRE Movement
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
}

export interface FinancialHealthResult {
    overallScore: number
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'

    // Dimensi Financial Health Network
    spend: {
        score: number
        status: string
        details: {
            expenseToIncomeRatio: number
            needsToIncomeRatio: number
            wantsToIncomeRatio: number
            isLivingWithinMeans: boolean
        }
        recommendations: string[]
    }

    save: {
        score: number
        status: string
        details: {
            savingsRate: number
            emergencyFundMonths: number
            hasAdequateEmergencyFund: boolean
            savingsRateStatus: string
        }
        recommendations: string[]
    }

    borrow: {
        score: number
        status: string
        details: {
            debtToIncomeRatio: number
            creditUtilizationRatio: number
            totalDebt: number
            debtStatus: string
        }
        recommendations: string[]
    }

    plan: {
        score: number
        status: string
        details: {
            hasBudget: boolean
            hasFinancialPlan: boolean
            hasRetirementPlan: boolean
            hasInsurance: boolean
            retirementReadiness: number
        }
        recommendations: string[]
    }
}

/**
 * FINANCIAL HEALTH NETWORK (FHN) - FinHealth Score®
 * Framework ini mengukur 4 dimensi kesehatan finansial
 */
export function calculateFinHealthScore(data: FinancialData): FinancialHealthResult {
    const spendScore = calculateSpendScore(data)
    const saveScore = calculateSaveScore(data)
    const borrowScore = calculateBorrowScore(data)
    const planScore = calculatePlanScore(data)

    // Bobot sesuai FinHealth Score® methodology
    const overallScore = Math.round(
        (spendScore.score * 0.25) +
        (saveScore.score * 0.30) +
        (borrowScore.score * 0.25) +
        (planScore.score * 0.20)
    )

    return {
        overallScore,
        status: getFinancialStatus(overallScore),
        spend: spendScore,
        save: saveScore,
        borrow: borrowScore,
        plan: planScore,
    }
}

/**
 * DIMENSI 1: SPEND (Belanja) - 50/30/20 Rule
 * Berdasarkan teori Elizabeth Warren
 */
function calculateSpendScore(data: FinancialData) {
    const expenseRatio = (data.monthlyExpenses / data.monthlyIncome) * 100
    const needsRatio = (data.needsExpenses / data.monthlyIncome) * 100
    const wantsRatio = (data.wantsExpenses / data.monthlyIncome) * 100

    let score = 0
    const recommendations: string[] = []

    // Scoring berdasarkan 50/30/20 rule
    if (needsRatio <= 50) {
        score += 40
    } else if (needsRatio <= 60) {
        score += 25
        recommendations.push('Kurangi pengeluaran kebutuhan hingga ≤50% pemasukan')
    } else {
        score += 10
        recommendations.push('Pengeluaran kebutuhan terlalu tinggi (>60%). Evaluasi biaya tetap seperti sewa/hipotek')
    }

    if (wantsRatio <= 30) {
        score += 30
    } else if (wantsRatio <= 40) {
        score += 20
        recommendations.push('Batasi pengeluaran keinginan hingga 30% pemasukan')
    } else {
        score += 5
        recommendations.push('Pengeluaran keinginan sangat tinggi. Terapkan aturan 50/30/20')
    }

    if (expenseRatio < 100) {
        score += 30
    } else if (expenseRatio === 100) {
        score += 15
        recommendations.push('Anda hidup pas-pasan. Cari cara meningkatkan pemasukan')
    } else {
        score += 0
        recommendations.push('Pengeluaran melebihi pemasukan! Segera buat budget dan kurangi pengeluaran')
    }

    const isLivingWithinMeans = expenseRatio <= 100

    return {
        score: Math.min(score, 100),
        status: getDimensionStatus(score),
        details: {
            expenseToIncomeRatio: expenseRatio,
            needsToIncomeRatio: needsRatio,
            wantsToIncomeRatio: wantsRatio,
            isLivingWithinMeans,
        },
        recommendations,
    }
}

/**
 * DIMENSI 2: SAVE (Tabungan)
 * Berdasarkan Emergency Fund Theory & Savings Rate standards
 */
function calculateSaveScore(data: FinancialData) {
    const savingsRate = data.monthlyIncome > 0
        ? (data.monthlySavings / data.monthlyIncome) * 100
        : 0

    const emergencyFundMonths = data.monthlyExpenses > 0
        ? data.emergencyFund / data.monthlyExpenses
        : 0

    let score = 0
    const recommendations: string[] = []

    // Savings Rate scoring (Wade Pfau: 16.6%, FIRE: 50-70%)
    if (savingsRate >= 20) {
        score += 40
    } else if (savingsRate >= 15) {
        score += 30
        recommendations.push('Tingkatkan tabungan ke 20% untuk keamanan finansial optimal')
    } else if (savingsRate >= 10) {
        score += 20
        recommendations.push('Tabungan di bawah rekomendasi. Target minimal 15-20% pemasukan')
    } else if (savingsRate > 0) {
        score += 10
        recommendations.push('Tabungan sangat rendah. Mulai dengan 10% dan tingkatkan bertahap')
    } else {
        score += 0
        recommendations.push('Anda belum menabung. Mulai sisihkan minimal 10% pemasukan')
    }

    // Emergency Fund scoring (Dave Ramsey, Suze Orman)
    if (emergencyFundMonths >= 6) {
        score += 40
    } else if (emergencyFundMonths >= 3) {
        score += 25
        recommendations.push('Dana darurat cukup, tapi tingkatkan ke 6 bulan untuk keamanan maksimal')
    } else if (emergencyFundMonths >= 1) {
        score += 15
        recommendations.push('Dana darurat kurang. Target: 3-6 bulan pengeluaran')
    } else {
        score += 5
        recommendations.push('Belum ada dana darurat! Prioritaskan membangun dana darurat 3-6 bulan')
    }

    // Additional savings score
    if (data.retirementSavings > 0) {
        score += 20
    } else {
        recommendations.push('Mulai menabung untuk pensiun sedini mungkin')
    }

    const savingsRateStatus = savingsRate >= 20 ? 'excellent'
        : savingsRate >= 15 ? 'good'
            : savingsRate >= 10 ? 'fair'
                : 'poor'

    return {
        score: Math.min(score, 100),
        status: getDimensionStatus(score),
        details: {
            savingsRate,
            emergencyFundMonths,
            hasAdequateEmergencyFund: emergencyFundMonths >= 3,
            savingsRateStatus,
        },
        recommendations,
    }
}

/**
 * DIMENSI 3: BORROW (Pinjaman)
 * Berdasarkan DTI standards industri keuangan
 */
function calculateBorrowScore(data: FinancialData) {
    // Debt-to-Income Ratio (DTI)
    const dti = data.monthlyIncome > 0
        ? (data.monthlyDebtPayments / data.monthlyIncome) * 100
        : 0

    let score = 0
    const recommendations: string[] = []
    let debtStatus = ''

    // DTI scoring berdasarkan standar industri
    if (dti <= 28) {
        score += 50
        debtStatus = 'Sangat sehat (DTI ≤28%)'
    } else if (dti <= 36) {
        score += 40
        debtStatus = 'Sehat (DTI ≤36%)'
        recommendations.push('DTI masih dalam batas sehat. Pertahankan!')
    } else if (dti <= 43) {
        score += 25
        debtStatus = 'Cukup (DTI 36-43%)'
        recommendations.push('Mulai kurangi utang. Target DTI ≤36%')
    } else if (dti <= 50) {
        score += 15
        debtStatus = 'Berisiko (DTI 43-50%)'
        recommendations.push('DTI tinggi! Prioritaskan pelunasan utang')
    } else {
        score += 5
        debtStatus = 'Kritis (DTI >50%)'
        recommendations.push('DTI sangat tinggi! Konsultasi dengan financial advisor')
    }

    // Credit utilization (jika ada credit card debt)
    if (data.creditCardDebt > 0) {
        const creditUtilization = data.monthlyIncome > 0
            ? (data.creditCardDebt / (data.monthlyIncome * 12)) * 100
            : 0

        if (creditUtilization <= 30) {
            score += 30
        } else if (creditUtilization <= 50) {
            score += 15
            recommendations.push('Penggunaan kartu kredit cukup tinggi. Kurangi ke ≤30%')
        } else {
            score += 5
            recommendations.push('Penggunaan kartu kredit sangat tinggi. Segera lunasi')
        }
    } else {
        score += 30 // No credit card debt is good
    }

    // Total debt load
    if (data.totalDebt === 0) {
        score += 20
    } else if (data.totalDebt < data.monthlyIncome * 6) {
        score += 10
    } else {
        recommendations.push('Total utang melebihi 6x pemasukan bulanan. Buat rencana pelunasan')
    }

    return {
        score: Math.min(score, 100),
        status: getDimensionStatus(score),
        details: {
            debtToIncomeRatio: dti,
            creditUtilizationRatio: data.monthlyIncome > 0
                ? (data.creditCardDebt / (data.monthlyIncome * 12)) * 100
                : 0,
            totalDebt: data.totalDebt,
            debtStatus,
        },
        recommendations,
    }
}

/**
 * DIMENSI 4: PLAN (Perencanaan)
 * Berdasarkan Financial Planning standards
 */
function calculatePlanScore(data: FinancialData) {
    let score = 0
    const recommendations: string[] = []

    // Budget
    if (data.hasBudget) {
        score += 20
    } else {
        recommendations.push('Buat budget bulanan untuk melacak pemasukan dan pengeluaran')
    }

    // Financial Plan
    if (data.hasFinancialPlan) {
        score += 20
    } else {
        recommendations.push('Buat rencana keuangan jangka pendek dan panjang')
    }

    // Retirement Plan
    if (data.hasRetirementPlan) {
        score += 20
    } else {
        recommendations.push('Mulai rencanakan dana pensiun. Semakin awal semakin baik')
    }

    // Insurance
    let insuranceScore = 0
    if (data.hasHealthInsurance) insuranceScore += 10
    if (data.hasLifeInsurance) insuranceScore += 10
    if (data.hasDisabilityInsurance) insuranceScore += 10

    score += insuranceScore

    if (insuranceScore < 30) {
        recommendations.push('Lengkapi perlindungan asuransi (kesehatan, jiwa, disabilitas)')
    }

    // Will/Estate Planning
    if (data.hasWill) {
        score += 10
    } else if (data.totalAssets > 0) {
        recommendations.push('Pertimbangkan membuat surat wasiat untuk melindungi aset')
    }

    // Retirement Readiness (simplified)
    const retirementReadiness = data.monthlyIncome > 0
        ? (data.retirementSavings / (data.monthlyIncome * 12 * 25)) * 100
        : 0

    return {
        score: Math.min(score, 100),
        status: getDimensionStatus(score),
        details: {
            hasBudget: data.hasBudget,
            hasFinancialPlan: data.hasFinancialPlan,
            hasRetirementPlan: data.hasRetirementPlan,
            hasInsurance: insuranceScore >= 20,
            retirementReadiness,
        },
        recommendations,
    }
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
    if (score >= 60) return 'good'
    if (score >= 40) return 'fair'
    if (score >= 20) return 'poor'
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

    if (finHealth.save.details.emergencyFundMonths < 3) {
        summary.urgentActions.push('⚠️ Dana darurat kurang dari 3 bulan')
    }

    if (dti.dti > 43) {
        summary.urgentActions.push('⚠️ DTI di atas 43%, prioritaskan pelunasan utang')
    }

    if (finHealth.spend.details.isLivingWithinMeans) {
        summary.strengths.push('✅ Hidup sesuai kemampuan')
    }

    if (finHealth.save.details.savingsRate >= 20) {
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