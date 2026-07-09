'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FinancialScoreGauge } from '@/components/charts/FinancialScoreGauge'
import { formatCurrency } from '@/lib/utils'
import {
    Heart,
    Shield,
    PiggyBank,
    TrendingUp,
    AlertCircle,
    CheckCircle,
} from 'lucide-react'

import { FinancialHealthResult, FinancialData } from '@/lib/financial-calculation'

export default function FinancialHealthPage() {
    const user = useAuthStore((state) => state.user)
    const [healthData, setHealthData] = useState<FinancialHealthResult | null>(null)
    const [finData, setFinData] = useState<FinancialData | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchHealthData = useCallback(async () => {
        try {
            const response = await fetch(`/api/financial-health?userId=${user?.id}`)
            const data = await response.json()
            setHealthData(data.health)
            setFinData(data.financialData)
        } catch (error) {
            console.error('Error fetching health data:', error)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchHealthData()
        }, 0)
        return () => clearTimeout(timer)
    }, [fetchHealthData])

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Financial Health</h1>
                <p className="text-muted-foreground">
                    Pantau kesehatan keuangan Anda secara keseluruhan
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Score Card */}
                <div className="lg:col-span-1">
                    {healthData && (
                        <FinancialScoreGauge
                            score={healthData.overallScore}
                            status={healthData.status}
                            breakdown={{
                                spend: healthData.spend.score,
                                save: healthData.save.score,
                                borrow: healthData.borrow.score,
                                plan: healthData.plan.score
                            }}
                        />
                    )}
                </div>

                {/* Metrics Cards */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Dana Darurat
                                </CardTitle>
                                <Shield className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {healthData?.save.details.emergencyFundMonths.toFixed(1)} bulan
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {healthData && healthData.save.details.emergencyFundMonths >= 6 ? (
                                        <span className="text-green-600 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            Dana darurat mencukupi
                                        </span>
                                    ) : (
                                        <span className="text-yellow-600 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Target: 6 bulan pengeluaran
                                        </span>
                                    )}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Tabungan Bulanan
                                </CardTitle>
                                <PiggyBank className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(finData?.totalSavings || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {finData &&
                                        finData.totalSavings > finData.monthlyIncome * 0.2 ? (
                                        <span className="text-green-600">
                                            Di atas 20% pemasukan
                                        </span>
                                    ) : (
                                        <span className="text-yellow-600">
                                            Target: 20% dari pemasukan
                                        </span>
                                    )}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Investasi
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-teal-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(finData?.investments || 0)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Status Keuangan
                                </CardTitle>
                                <Heart className="h-4 w-4 text-pink-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold capitalize">
                                    {healthData?.status === 'excellent'
                                        ? 'Sangat Baik'
                                        : healthData?.status === 'good'
                                            ? 'Baik'
                                            : healthData?.status === 'fair'
                                                ? 'Cukup'
                                                : healthData?.status === 'poor'
                                                    ? 'Perlu Perbaikan'
                                                    : 'Kritis'}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tips */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Rekomendasi & Tips</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-blue-900">Dana Darurat</p>
                                    <p className="text-sm text-blue-700">
                                        Pastikan dana darurat minimal 3-6 bulan pengeluaran
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                                <PiggyBank className="h-5 w-5 text-green-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-green-900">Aturan 50/30/20</p>
                                    <p className="text-sm text-green-700">
                                        50% kebutuhan, 30% keinginan, 20% tabungan/investasi
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-purple-900">Diversifikasi</p>
                                    <p className="text-sm text-purple-700">
                                        Jangan taruh semua telur dalam satu keranjang
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}