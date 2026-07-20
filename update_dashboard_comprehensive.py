import os

file_path = r'd:\repository\financial-app\src\app\(dashboard)\dashboard\page.tsx'

content = """'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { IncomeExpenseChart } from '@/components/charts/IncomeExpenseChart'
import { CategoryBreakdown } from '@/components/charts/CategoryBreakdown'
import { FinancialScoreGauge } from '@/components/charts/FinancialScoreGauge'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, calculatePercentage } from '@/lib/utils'
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
    CalendarClock,
    Wallet,
    ArrowRight,
    ArrowUpRight,
    ArrowDownRight,
    ListTodo,
    ChevronRight,
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
    topBudgets: any[]
    activeGoals: any[]
    topDebts: any[]
    recentTransactions: any[]
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
            const currentMonth = new Date().toISOString().substring(0, 7) + "-01"
            
            // Fetch all dashboard data
            const [summaryRes, categoryRes, healthRes, walletsRes, allTimeCategoryRes, debtsRes, budgetsRes, goalsRes, txRes] = await Promise.all([
                fetch(`/api/reports/monthly-summary?userId=${user?.id}`),
                fetch(`/api/reports/category-analysis?userId=${user?.id}`),
                fetch(`/api/financial-health?userId=${user?.id}`),
                fetch(`/api/wallets?userId=${user?.id}`),
                fetch(`/api/reports/category-analysis?userId=${user?.id}&timeframe=all`),
                fetch(`/api/debts`),
                fetch(`/api/budgets?userId=${user?.id}&month=${currentMonth}`),
                fetch(`/api/goals?userId=${user?.id}`),
                fetch(`/api/transactions?userId=${user?.id}&limit=5`)
            ])

            const summary = await summaryRes.json()
            const category = await categoryRes.json()
            const health = await healthRes.json()
            const allTimeCategory = await allTimeCategoryRes.json()
            
            let debtsSummary = { totalRemaining: 0, count: 0 }
            let receivablesSummary = { totalRemaining: 0, count: 0 }
            let topDebts: any[] = []
            
            if (debtsRes.ok) {
                const debtsData = await debtsRes.json()
                const debts = debtsData.debts || []
                
                // Get active debts for list
                const active = debts.filter((d: any) => d.status !== 'paid')
                topDebts = active.slice(0, 4) // top 4 active debts/receivables
                
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

            let topBudgets = []
            if (budgetsRes.ok) {
                const budgetData = await budgetsRes.json()
                // sort by highest percentage spent, but only active ones
                const activeBudgets = (budgetData.budgets || []).filter((b: any) => b.spent < b.amount)
                topBudgets = activeBudgets.sort((a: any, b: any) => (b.spent / b.amount) - (a.spent / a.amount)).slice(0, 3)
            }
            
            let activeGoals = []
            if (goalsRes.ok) {
                const goalsData = await goalsRes.json()
                activeGoals = (goalsData.goals || []).filter((g: any) => g.status !== 'completed').slice(0, 3)
            }
            
            let recentTransactions = []
            if (txRes.ok) {
                const txData = await txRes.json()
                recentTransactions = txData.transactions || []
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
                topBudgets,
                activeGoals,
                topDebts,
                recentTransactions,
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
        <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">Ringkasan kesehatan finansial Anda bulan ini.</p>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="gap-2 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh Data
                </Button>
            </div>

            {/* Row 1: Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-background border-emerald-100 dark:border-emerald-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Pemasukan</CardTitle>
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(data?.summary.totalIncome || 0)}
                        </div>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">Bulan ini</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/30 dark:to-background border-rose-100 dark:border-rose-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400">Pengeluaran</CardTitle>
                        <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg">
                            <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-rose-700 dark:text-rose-400">
                            {formatCurrency(data?.summary.totalExpenses || 0)}
                        </div>
                        <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mt-1">Bulan ini</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-background border-blue-100 dark:border-blue-900/50">
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
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                            +{formatCurrency(data?.summary.balance || 0)} bulan ini
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-background border-purple-100 dark:border-purple-900/50">
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

                <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-background border-amber-100 dark:border-amber-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Sisa Utang</CardTitle>
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                            <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-amber-700 dark:text-amber-400">
                            {formatCurrency(data?.debtsSummary?.totalRemaining || 0)}
                        </div>
                        <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">{data?.debtsSummary?.count || 0} utang aktif</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-teal-50 to-white dark:from-teal-950/30 dark:to-background border-teal-100 dark:border-teal-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-teal-700 dark:text-teal-400">Sisa Piutang</CardTitle>
                        <div className="p-2 bg-teal-100 dark:bg-teal-900/50 rounded-lg">
                            <HandCoins className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-teal-700 dark:text-teal-400">
                            {formatCurrency(data?.receivablesSummary?.totalRemaining || 0)}
                        </div>
                        <p className="text-xs text-teal-600/70 dark:text-teal-400/70 mt-1">{data?.receivablesSummary?.count || 0} piutang aktif</p>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Macro Analysis (Income vs Expense & Health Score) */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ArrowRight className="h-5 w-5 text-indigo-500" />
                            Pemasukan vs Pengeluaran
                        </CardTitle>
                        <CardDescription>Tren keuangan Anda dalam beberapa bulan terakhir.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <IncomeExpenseChart data={data?.monthlyData || []} />
                    </CardContent>
                </Card>

                <FinancialScoreGauge
                    score={data?.healthScore.score || 0}
                    status={data?.healthScore.status || 'fair'}
                    breakdown={data?.healthScore.breakdown || {}}
                />
            </div>

            {/* Row 3: Daily Operations (Budgets, Goals, Debts) */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Budget Column */}
                <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60 flex flex-col">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ListTodo className="h-5 w-5 text-indigo-500" /> 
                                Budget Bulan Ini
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
                                <Link href="/budget">Lihat <ChevronRight className="h-3 w-3 ml-1" /></Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 flex-grow">
                        {data?.topBudgets && data.topBudgets.length > 0 ? (
                            <div className="space-y-4">
                                {data.topBudgets.map((b: any) => {
                                    const percent = calculatePercentage(b.spent, b.amount)
                                    return (
                                        <div key={b.id} className="space-y-2 group">
                                            <div className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: b.category?.color || '#cbd5e1' }} />
                                                    <span className="font-medium">{b.category?.name}</span>
                                                </div>
                                                <span className="text-muted-foreground font-medium text-xs">
                                                    {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                                                </span>
                                            </div>
                                            <Progress value={Math.min(percent, 100)} className={`h-2 transition-all ${percent >= 100 ? 'bg-red-100 [&>div]:bg-red-500' : percent > 80 ? 'bg-amber-100 [&>div]:bg-amber-500' : 'bg-indigo-100 [&>div]:bg-indigo-500'}`} />
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-6 text-center opacity-70">
                                <CalendarClock className="h-10 w-10 text-muted-foreground mb-3" />
                                <p className="text-sm font-medium">Belum ada budget aktif</p>
                                <p className="text-xs text-muted-foreground mt-1">Buat plot tagihan untuk memantau pengeluaran</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Goals Column */}
                <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60 flex flex-col">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Target className="h-5 w-5 text-emerald-500" /> 
                                Target Tabungan
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700">
                                <Link href="/goals">Lihat <ChevronRight className="h-3 w-3 ml-1" /></Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 flex-grow">
                        {data?.activeGoals && data.activeGoals.length > 0 ? (
                            <div className="space-y-4">
                                {data.activeGoals.map((g: any) => {
                                    const percent = calculatePercentage(g.currentAmount, g.targetAmount)
                                    return (
                                        <div key={g.id} className="space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-medium line-clamp-1">{g.name}</span>
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">{percent}%</span>
                                            </div>
                                            <Progress value={Math.min(percent, 100)} className="h-2 bg-emerald-100 [&>div]:bg-emerald-500" />
                                            <p className="text-[11px] text-muted-foreground text-right mt-1">
                                                Sisa: {formatCurrency(g.targetAmount - g.currentAmount)}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-6 text-center opacity-70">
                                <Target className="h-10 w-10 text-muted-foreground mb-3" />
                                <p className="text-sm font-medium">Tidak ada target tabungan</p>
                                <p className="text-xs text-muted-foreground mt-1">Buat tujuan finansial Anda sekarang</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Debts Column */}
                <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60 flex flex-col">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-rose-500" /> 
                                Utang & Piutang
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700">
                                <Link href="/debts">Lihat <ChevronRight className="h-3 w-3 ml-1" /></Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 p-0 sm:p-0 flex-grow">
                        {data?.topDebts && data.topDebts.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {data.topDebts.map((d: any) => (
                                    <div key={d.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${d.type === 'debt' ? 'bg-rose-100 text-rose-600' : 'bg-teal-100 text-teal-600'}`}>
                                                {d.type === 'debt' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm leading-tight">{d.personName}</p>
                                                <p className="text-[11px] text-muted-foreground">{d.type === 'debt' ? 'Anda berutang' : 'Berutang ke Anda'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-sm ${d.type === 'debt' ? 'text-rose-600 dark:text-rose-400' : 'text-teal-600 dark:text-teal-400'}`}>
                                                {formatCurrency(d.remainingAmount)}
                                            </p>
                                            {d.dueDate && (
                                                <p className="text-[10px] text-muted-foreground">
                                                    Jatuh Tempo: {new Date(d.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-10 text-center opacity-70">
                                <HandCoins className="h-10 w-10 text-muted-foreground mb-3" />
                                <p className="text-sm font-medium">Bebas utang & piutang</p>
                                <p className="text-xs text-muted-foreground mt-1">Catatan Anda bersih saat ini</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Row 4: Recent Transactions */}
            <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-indigo-500" />
                        Transaksi Terbaru
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-indigo-600 dark:text-indigo-400">
                        <Link href="/transactions">Lihat Semua Transaksi</Link>
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {data?.recentTransactions && data.recentTransactions.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {data.recentTransactions.map((tx: any) => (
                                <div key={tx.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                            tx.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50' 
                                            : tx.type === 'expense' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/50'
                                            : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50'
                                        }`}>
                                            {tx.type === 'income' ? <ArrowDownRight className="h-5 w-5" /> : tx.type === 'expense' ? <ArrowUpRight className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm sm:text-base leading-tight">
                                                {tx.description || tx.category?.name || 'Transaksi'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-[11px] sm:text-xs text-muted-foreground">
                                                <span>{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                <span className="hidden sm:inline">•</span>
                                                <span className="hidden sm:flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tx.category?.color || '#cbd5e1' }} />
                                                    {tx.category?.name || 'Lainnya'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-sm sm:text-base ${
                                            tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' 
                                            : tx.type === 'expense' ? 'text-rose-600 dark:text-rose-400'
                                            : 'text-indigo-600 dark:text-indigo-400'
                                        }`}>
                                            {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatCurrency(tx.amount)}
                                        </p>
                                        <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
                                            {tx.wallet?.name}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>Belum ada transaksi</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Row 5: Detailed Charts (Category All Time) */}
            <div className="grid lg:grid-cols-2 gap-6 mt-6">
                <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60">
                    <CardHeader>
                        <CardTitle>Total Pengeluaran (Semua Waktu)</CardTitle>
                        <CardDescription>Akumulasi sejak Anda menggunakan aplikasi.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center items-center h-[280px]">
                        <div className="p-6 rounded-full bg-rose-50 dark:bg-rose-950/30 mb-6">
                            <TrendingDown className="h-12 w-12 text-rose-500" />
                        </div>
                        <div className="text-4xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
                            {formatCurrency(data?.allTimeTotalExpenses || 0)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60">
                    <CardHeader>
                        <CardTitle>Pengeluaran per Kategori (Semua Waktu)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CategoryBreakdown data={data?.allTimeCategoryData || []} />
                    </CardContent>
                </Card>
            </div>
            
            <div className="py-4 text-center text-xs text-muted-foreground">
                <p>Data terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}</p>
            </div>
        </div>
    )
}
"""

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
