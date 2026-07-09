'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
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
} from 'lucide-react'

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
    healthScore: {
        score: number
        status: 'excellent' | 'good' | 'fair' | 'poor'
        breakdown: Record<string, number>
    }
}

export default function DashboardPage() {
    const user = useAuthStore((state) => state.user)
    const [data, setData] = useState<DashboardData | null>(null)
    const [totalWalletBalance, setTotalWalletBalance] = useState(0)
    const [loading, setLoading] = useState(true)

    const fetchDashboardData = useCallback(async () => {
        if (!user?.id) {
            setLoading(false)
            return
        }
        try {
            // Fetch all dashboard data
            const [summaryRes, categoryRes, healthRes, walletsRes] = await Promise.all([
                fetch(`/api/reports/monthly-summary?userId=${user?.id}`),
                fetch(`/api/reports/category-analysis?userId=${user?.id}`),
                fetch(`/api/financial-health?userId=${user?.id}`),
                fetch(`/api/wallets?userId=${user?.id}`)
            ])

            const summary = await summaryRes.json()
            const category = await categoryRes.json()
            const health = await healthRes.json()
            
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
                healthScore: {
                    score: health.health?.overallScore || 0,
                    status: health.health?.status || 'fair',
                    breakdown: {
                        spend: health.health?.spend?.score || 0,
                        save: health.health?.save?.score || 0,
                        borrow: health.health?.borrow?.score || 0,
                        plan: health.health?.plan?.score || 0,
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(data?.summary.totalIncome || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Bulan ini</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(data?.summary.totalExpenses || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Bulan ini</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Saldo Seluruh Dompet</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(totalWalletBalance)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-green-600">
                            +{formatCurrency(data?.summary.balance || 0)} bulan ini
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tabungan Rate</CardTitle>
                        <PiggyBank className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {data?.summary.savingsRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">Dari pemasukan</p>
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