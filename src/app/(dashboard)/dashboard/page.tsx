'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IncomeExpenseChart } from '@/components/charts/IncomeExpenseChart'
import { CategoryBreakdown } from '@/components/charts/CategoryBreakdown'
import { FinancialScoreGauge } from '@/components/charts/FinancialScoreGauge'
import { formatCurrency } from '@/lib/utils'
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    PiggyBank,
    Target,
    AlertCircle,
    RefreshCw,
    CreditCard,
    HandCoins,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardData {
    summary: {
        totalIncome: number
        totalExpenses: number
        balance: number
        savingsRate: number
    }
    monthlyData: {
        month: string
        income: number
        expense: number
    }[]
    categoryData: {
        categoryName: string
        totalAmount: number
        percentage: number
        color: string
    }[]
    allTimeCategoryData: {
        categoryName: string
        totalAmount: number
        percentage: number
        color: string
    }[]
    allTimeTotalExpenses: number
    debtsSummary: { totalRemaining: number, count: number }
    receivablesSummary: { totalRemaining: number, count: number }
    healthScore: {
        score: number
        status: 'excellent' | 'good' | 'fair' | 'poor'
        breakdown: Record<string, number>
    }
}

export default function DashboardPage() {
    const { data: session } = useSession()
    const user = session?.user
    const [data, setData] = useState<DashboardData | null>(null)
    const [totalWalletBalance, setTotalWalletBalance] = useState(0)
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const fetchDashboardData = useCallback(async () => {
        if (!user?.id) {
            setLoading(false)
            return
        }
        try {
            // Fetch all dashboard data
            const [summaryRes, categoryRes, healthRes, walletsRes, allTimeCategoryRes, debtsRes] = await Promise.all([
                fetch(`/api/reports/monthly-summary?userId=${user?.id}`),
                fetch(`/api/reports/category-analysis?userId=${user?.id}`),
                fetch(`/api/financial-health?userId=${user?.id}`),
                fetch(`/api/wallets?userId=${user?.id}`),
                fetch(`/api/reports/category-analysis?userId=${user?.id}&timeframe=all`),
                fetch(`/api/debts`)
            ])

            const summary = await summaryRes.json()
            const category = await categoryRes.json()
            const health = await healthRes.json()
            const allTimeCategory = await allTimeCategoryRes.json()
            let debtsSummary = { totalRemaining: 0, count: 0 }
            let receivablesSummary = { totalRemaining: 0, count: 0 }
            
            if (debtsRes.ok) {
                const debtsData = await debtsRes.json()
                const debts = debtsData.debts || []
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                debts.forEach((d: any) => {
                    if (d.type === 'debt') {
                        debtsSummary.totalRemaining += d.remainingAmount
                        debtsSummary.count++
                    } else if (d.type === 'receivable') {
                        receivablesSummary.totalRemaining += d.remainingAmount
                        receivablesSummary.count++
                    }
                })
            }
            
            if (walletsRes.ok) {
                const walletsData = await walletsRes.json()
                const sum = (walletsData.wallets || []).reduce((acc: number, w: { balance: number }) => acc + w.balance, 0)
                setTotalWalletBalance(sum)
            }

            // Monthly data is now fetched from the API
            const monthlyData = summary.history || []

            setData({
                summary: summary.summary || {
                    totalIncome: 0,
                    totalExpenses: 0,
                    balance: 0,
                    savingsRate: 0,
                },
                monthlyData,
                categoryData: category.analysis || [],
                allTimeCategoryData: allTimeCategory.analysis || [],
                allTimeTotalExpenses: allTimeCategory.totalAmount || 0,
                debtsSummary,
                receivablesSummary,
                healthScore: {
                    score: health.health?.overallScore || 0,
                    status: health.health?.status || 'fair',
                    breakdown: {
                        savingsRate: health.health?.savingsRate?.score || 0,
                        emergencyFund: health.health?.emergencyFund?.score || 0,
                        dti: health.health?.dti?.score || 0,
                        budgetAdherence: health.health?.budgetAdherence?.score || 0,
                        investmentRatio: health.health?.investmentRatio?.score || 0,
                    },
                },
            })
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDashboardData()
        }, 0)
        return () => clearTimeout(timer)
    }, [fetchDashboardData])

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetchDashboardData()
        setIsRefreshing(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh Data
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background border-green-100 dark:border-green-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Pemasukan</CardTitle>
                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-green-700 dark:text-green-400">
                            {formatCurrency(data?.summary.totalIncome || 0)}
                        </div>
                        <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">Bulan ini</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background border-red-100 dark:border-red-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Pengeluaran</CardTitle>
                        <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-red-700 dark:text-red-400">
                            {formatCurrency(data?.summary.totalExpenses || 0)}
                        </div>
                        <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">Bulan ini</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-100 dark:border-blue-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Saldo Dompet</CardTitle>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-blue-700 dark:text-blue-400">
                            {formatCurrency(totalWalletBalance)}
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            +{formatCurrency(data?.summary.balance || 0)} bulan ini
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background border-purple-100 dark:border-purple-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">Rate Tabungan</CardTitle>
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                            <PiggyBank className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-purple-700 dark:text-purple-400">
                            {data?.summary.savingsRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">Dari pemasukan</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-background border-rose-100 dark:border-rose-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400">Sisa Utang</CardTitle>
                        <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg">
                            <CreditCard className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-rose-700 dark:text-rose-400">
                            {formatCurrency(data?.debtsSummary?.totalRemaining || 0)}
                        </div>
                        <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mt-1">{data?.debtsSummary?.count || 0} utang aktif</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background border-emerald-100 dark:border-emerald-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Sisa Piutang</CardTitle>
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                            <HandCoins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(data?.receivablesSummary?.totalRemaining || 0)}
                        </div>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">{data?.receivablesSummary?.count || 0} piutang aktif</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Pemasukan vs Pengeluaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <IncomeExpenseChart data={data?.monthlyData || []} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Pengeluaran per Kategori</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CategoryBreakdown data={data?.categoryData || []} />
                    </CardContent>
                </Card>
            </div>

            {/* All-Time Data */}
            <h2 className="text-2xl font-bold mt-8 mb-4">Ringkasan Seluruh Waktu</h2>
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Pengeluaran (Semua Waktu)</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center items-center h-[300px]">
                        <TrendingDown className="h-16 w-16 text-red-500 mb-4 opacity-80" />
                        <div className="text-4xl font-bold text-red-600">
                            {formatCurrency(data?.allTimeTotalExpenses || 0)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            Sejak transaksi pertama hingga saat ini
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Pengeluaran per Kategori (Semua Waktu)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CategoryBreakdown data={data?.allTimeCategoryData || []} />
                    </CardContent>
                </Card>
            </div>

            {/* Financial Health */}
            <div className="grid lg:grid-cols-2 gap-6">
                <FinancialScoreGauge
                    score={data?.healthScore.score || 0}
                    status={data?.healthScore.status || 'fair'}
                    breakdown={data?.healthScore.breakdown || {}}
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Tips Keuangan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                            <Target className="h-5 w-5 text-blue-600 mt-1" />
                            <div>
                                <h4 className="font-semibold text-blue-900">Target Tabungan</h4>
                                <p className="text-sm text-blue-700">
                                    Usahakan menabung minimal 20% dari pemasukan bulanan Anda
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-1" />
                            <div>
                                <h4 className="font-semibold text-yellow-900">Dana Darurat</h4>
                                <p className="text-sm text-yellow-700">
                                    Siapkan dana darurat 3-6 kali pengeluaran bulanan
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                            <PiggyBank className="h-5 w-5 text-green-600 mt-1" />
                            <div>
                                <h4 className="font-semibold text-green-900">Investasi</h4>
                                <p className="text-sm text-green-700">
                                    Diversifikasi investasi Anda untuk mengurangi risiko
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}