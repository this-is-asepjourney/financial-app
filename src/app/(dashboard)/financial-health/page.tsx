'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FinancialScoreGauge } from '@/components/charts/FinancialScoreGauge'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
    Shield,
    PiggyBank,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle,
    XCircle,
    RefreshCw,
    Percent,
    Wallet,
    CreditCard,
    BarChart2,
    ChevronRight,
    Lightbulb,
} from 'lucide-react'
import { FinancialHealthResult, FinancialData } from '@/lib/financial-calculation'

interface Indicator {
    key: keyof Pick<FinancialHealthResult, 'savingsRate' | 'emergencyFund' | 'dti' | 'budgetAdherence' | 'investmentRatio'>
    label: string
    description: string
    icon: React.ElementType
    weight: string
    formatValue: (v: number) => string
    goodThreshold: number
    color: string
}

const INDICATORS: Indicator[] = [
    {
        key: 'savingsRate',
        label: 'Tabungan',
        description: 'Proporsi pendapatan yang berhasil ditabung bulan ini',
        icon: PiggyBank,
        weight: '30%',
        formatValue: v => `${(v * 100).toFixed(1)}%`,
        goodThreshold: 60,
        color: 'blue',
    },
    {
        key: 'emergencyFund',
        label: 'Dana Darurat',
        description: 'Kecukupan dana darurat dalam satuan bulan pengeluaran',
        icon: Shield,
        weight: '25%',
        formatValue: v => `${v.toFixed(1)} bln`,
        goodThreshold: 70,
        color: 'green',
    },
    {
        key: 'dti',
        label: 'Rasio Utang (DTI)',
        description: 'Cicilan bulanan dibanding total pendapatan — semakin kecil semakin sehat',
        icon: CreditCard,
        weight: '20%',
        formatValue: v => `${(v * 100).toFixed(1)}%`,
        goodThreshold: 60,
        color: 'purple',
    },
    {
        key: 'budgetAdherence',
        label: 'Disiplin Budget',
        description: 'Seberapa ketat Anda mengikuti anggaran yang telah ditetapkan',
        icon: Wallet,
        weight: '15%',
        formatValue: () => '',
        goodThreshold: 70,
        color: 'orange',
    },
    {
        key: 'investmentRatio',
        label: 'Investasi',
        description: 'Proporsi aset yang dialokasikan ke instrumen investasi produktif',
        icon: TrendingUp,
        weight: '10%',
        formatValue: v => `${(v * 100).toFixed(1)}%`,
        goodThreshold: 50,
        color: 'teal',
    },
]

const COLOR_MAP: Record<string, { text: string; bg: string; bar: string; border: string }> = {
    blue: { text: 'text-blue-600', bg: 'bg-blue-100', bar: 'bg-blue-500', border: 'border-blue-200' },
    green: { text: 'text-green-600', bg: 'bg-green-100', bar: 'bg-green-500', border: 'border-green-200' },
    purple: { text: 'text-purple-600', bg: 'bg-purple-100', bar: 'bg-purple-500', border: 'border-purple-200' },
    orange: { text: 'text-orange-600', bg: 'bg-orange-100', bar: 'bg-orange-500', border: 'border-orange-200' },
    teal: { text: 'text-teal-600', bg: 'bg-teal-100', bar: 'bg-teal-500', border: 'border-teal-200' },
}

function generateRecommendations(health: FinancialHealthResult, data: FinancialData): { icon: React.ElementType; title: string; desc: string; color: string }[] {
    const recs: { icon: React.ElementType; title: string; desc: string; color: string }[] = []

    if (health.savingsRate.score < 60) {
        recs.push({
            icon: PiggyBank,
            title: 'Tingkatkan Tabungan',
            desc: `Saat ini Anda menabung ${(health.savingsRate.value * 100).toFixed(1)}% dari pendapatan. Target minimal 20% (aturan 50/30/20).`,
            color: 'blue',
        })
    }

    if (health.emergencyFund.score < 70) {
        recs.push({
            icon: Shield,
            title: 'Dana Darurat Belum Cukup',
            desc: `Dana darurat Anda cukup untuk ${health.emergencyFund.value.toFixed(1)} bulan. Targetkan minimal 3–6 bulan pengeluaran.`,
            color: 'green',
        })
    }

    if (health.dti.score < 60) {
        recs.push({
            icon: CreditCard,
            title: 'Beban Utang Tinggi',
            desc: `Rasio cicilan terhadap pendapatan Anda ${(health.dti.value * 100).toFixed(1)}%. Idealnya di bawah 36%. Hindari utang baru.`,
            color: 'red',
        })
    }

    if (health.budgetAdherence.score < 70) {
        recs.push({
            icon: Wallet,
            title: 'Disiplin Budget Perlu Ditingkatkan',
            desc: 'Pengeluaran Anda melebihi anggaran di beberapa kategori. Tinjau ulang rencana anggaran Anda.',
            color: 'orange',
        })
    }

    if (health.investmentRatio.score < 50) {
        recs.push({
            icon: TrendingUp,
            title: 'Mulai atau Tambah Investasi',
            desc: `Alokasikan setidaknya 10–30% aset ke investasi produktif untuk pertumbuhan jangka panjang. Coba reksa dana atau saham.`,
            color: 'teal',
        })
    }

    if (recs.length === 0) {
        recs.push({
            icon: CheckCircle,
            title: 'Kondisi Keuangan Sangat Baik!',
            desc: 'Semua indikator berada dalam kondisi optimal. Pertahankan disiplin dan terus tingkatkan porsi investasi.',
            color: 'green',
        })
    }

    return recs.slice(0, 3)
}

const STATUS_CONFIG = {
    excellent: { label: 'Sangat Sehat', color: 'text-green-600', bg: 'bg-green-100' },
    good: { label: 'Sehat', color: 'text-blue-600', bg: 'bg-blue-100' },
    fair: { label: 'Cukup', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    poor: { label: 'Perlu Perbaikan', color: 'text-orange-600', bg: 'bg-orange-100' },
    critical: { label: 'Kritis', color: 'text-red-600', bg: 'bg-red-100' },
}

export default function FinancialHealthPage() {
    const { data: session } = useSession()
    const user = session?.user
    const [healthData, setHealthData] = useState<FinancialHealthResult | null>(null)
    const [finData, setFinData] = useState<FinancialData | null>(null)
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const fetchHealthData = useCallback(async () => {
        if (!user?.id) return
        try {
            const response = await fetch(`/api/financial-health?userId=${user?.id}`)
            const data = await response.json()
            if (response.ok) {
                setHealthData(data.health)
                setFinData(data.financialData)
            }
        } catch (err) {
            console.error('Error fetching health data:', err)
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }, [user])

    useEffect(() => {
        const timer = setTimeout(() => fetchHealthData(), 0)
        return () => clearTimeout(timer)
    }, [fetchHealthData])

    const handleRefresh = () => { setIsRefreshing(true); fetchHealthData() }

    if (loading) {
        return (
            <div className="p-4 sm:p-6 space-y-6">
                <div className="h-10 bg-muted animate-pulse rounded w-1/3" />
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="h-64 bg-muted animate-pulse rounded-xl" />
                    <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}
                    </div>
                </div>
            </div>
        )
    }

    const recommendations = healthData && finData ? generateRecommendations(healthData, finData) : []
    const statusConfig = healthData ? STATUS_CONFIG[healthData.status] : null

    return (
        <div className="p-4 sm:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Health</h1>
                    <p className="text-muted-foreground mt-1">
                        Analisis komprehensif kesehatan keuangan Anda berdasarkan 5 indikator utama
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {statusConfig && (
                        <span className={cn('px-3 py-1.5 rounded-full text-sm font-semibold', statusConfig.bg, statusConfig.color)}>
                            {statusConfig.label}
                        </span>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="gap-2"
                    >
                        <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Score Gauge */}
                <div className="lg:col-span-1 space-y-4">
                    {healthData && (
                        <FinancialScoreGauge
                            score={healthData.overallScore}
                            status={healthData.status}
                            breakdown={{
                                savingsRate: healthData.savingsRate.score,
                                emergencyFund: healthData.emergencyFund.score,
                                dti: healthData.dti.score,
                                budgetAdherence: healthData.budgetAdherence.score,
                                investmentRatio: healthData.investmentRatio.score
                            }}
                        />
                    )}

                    {/* Quick Stats */}
                    {finData && (
                        <Card className="border-muted">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Ringkasan Bulan Ini</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <TrendingUp className="h-3.5 w-3.5 text-green-500" /> Pemasukan
                                    </span>
                                    <span className="text-sm font-semibold text-green-600">{formatCurrency(finData.monthlyIncome)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <TrendingDown className="h-3.5 w-3.5 text-red-500" /> Pengeluaran
                                    </span>
                                    <span className="text-sm font-semibold text-red-600">{formatCurrency(finData.monthlyExpenses)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <CreditCard className="h-3.5 w-3.5 text-rose-500" /> Cicilan/Bulan
                                    </span>
                                    <span className="text-sm font-semibold text-rose-600">{formatCurrency(finData.monthlyDebtPayments)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <BarChart2 className="h-3.5 w-3.5 text-teal-500" /> Total Investasi
                                    </span>
                                    <span className="text-sm font-semibold text-teal-600">{formatCurrency(finData.investments)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <Percent className="h-3.5 w-3.5 text-blue-500" /> Dana Darurat
                                    </span>
                                    <span className="text-sm font-semibold text-blue-600">{formatCurrency(finData.emergencyFund)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 5 Indicator Cards */}
                    <div className="space-y-3">
                        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">5 Indikator Utama</h2>
                        {healthData && INDICATORS.map((indicator) => {
                            const result = healthData[indicator.key]
                            const score = result.score
                            const value = result.value
                            const colors = COLOR_MAP[indicator.color]
                            const Icon = indicator.icon
                            const isGood = score >= indicator.goodThreshold

                            return (
                                <Card key={indicator.key} className={cn('border overflow-hidden', colors.border)}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colors.bg)}>
                                                <Icon className={cn('h-5 w-5', colors.text)} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm">{indicator.label}</span>
                                                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Bobot {indicator.weight}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {indicator.formatValue(value) && (
                                                            <span className={cn('text-xs font-medium', colors.text)}>
                                                                {indicator.formatValue(value)}
                                                            </span>
                                                        )}
                                                        {isGood
                                                            ? <CheckCircle className="h-4 w-4 text-green-500" />
                                                            : score >= 30
                                                                ? <AlertCircle className="h-4 w-4 text-yellow-500" />
                                                                : <XCircle className="h-4 w-4 text-red-500" />
                                                        }
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-2">{indicator.description}</p>
                                                <div className="flex items-center gap-3">
                                                    <Progress
                                                        value={score}
                                                        className="h-2 flex-1"
                                                        indicatorClassName={cn(
                                                            'transition-all duration-700',
                                                            score >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                                            score >= 60 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                                                            score >= 40 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                                                            'bg-gradient-to-r from-red-400 to-rose-500'
                                                        )}
                                                    />
                                                    <span className="text-xs font-bold text-muted-foreground w-8 text-right">{Math.round(score)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Dynamic Recommendations */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Lightbulb className="h-5 w-5 text-amber-500" />
                                Rekomendasi Personalisasi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recommendations.map((rec, i) => {
                                const RecIcon = rec.icon
                                const colors = COLOR_MAP[rec.color] || COLOR_MAP.blue
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            'flex items-start gap-3 p-3.5 rounded-xl border',
                                            colors.bg.replace('bg-', 'bg-').replace('-100', '-50'),
                                            colors.border
                                        )}
                                    >
                                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', colors.bg)}>
                                            <RecIcon className={cn('h-4.5 w-4.5', colors.text)} />
                                        </div>
                                        <div className="flex-1">
                                            <p className={cn('font-semibold text-sm', colors.text)}>{rec.title}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{rec.desc}</p>
                                        </div>
                                        <ChevronRight className={cn('h-4 w-4 flex-shrink-0 mt-0.5', colors.text)} />
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>

                    {/* Score Classification */}
                    <Card className="border-muted">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Panduan Skor</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-5 gap-1.5">
                                {[
                                    { range: '80–100', label: 'Sangat Sehat', color: 'bg-green-100 text-green-700 border-green-200' },
                                    { range: '65–79', label: 'Sehat', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                                    { range: '50–64', label: 'Cukup', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                                    { range: '35–49', label: 'Kurang', color: 'bg-orange-100 text-orange-700 border-orange-200' },
                                    { range: '0–34', label: 'Kritis', color: 'bg-red-100 text-red-700 border-red-200' },
                                ].map(item => (
                                    <div key={item.range} className={cn('text-center p-2 rounded-lg border text-xs font-medium', item.color)}>
                                        <div className="font-bold">{item.range}</div>
                                        <div className="text-[10px] mt-0.5 opacity-80">{item.label}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}