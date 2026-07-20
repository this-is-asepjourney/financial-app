'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FinancialScoreGauge } from '@/components/charts/FinancialScoreGauge'
import { calculateFinHealthScore, FinancialData, FinancialHealthResult } from '@/lib/financial-calculation'
import { formatCurrency } from '@/lib/utils'
import {
    Activity,
    Info,
    ArrowLeft,
    TrendingUp,
    PiggyBank,
    CreditCard,
    Target,
    BookOpen,
    RefreshCw,
    Calculator,
    AlertTriangle,
    CheckCircle,
    Bot,
    Sparkles
} from 'lucide-react'

export default function FinancialHealthPage() {
    const { data: session } = useSession()
    const user = session?.user
    const [loading, setLoading] = useState(true)
    const [realData, setRealData] = useState<FinancialData | null>(null)
    const [realHealth, setRealHealth] = useState<FinancialHealthResult | null>(null)
    
    // Simulation state
    const [simData, setSimData] = useState<FinancialData | null>(null)
    const [simHealth, setSimHealth] = useState<FinancialHealthResult | null>(null)

    const fetchHealthData = useCallback(async () => {
        if (!user?.id) return
        try {
            const res = await fetch(`/api/financial-health`)
            if (res.ok) {
                const data = await res.json()
                setRealData(data.financialData)
                setRealHealth(data.health)
                setSimData(JSON.parse(JSON.stringify(data.financialData)))
                setSimHealth(data.health)
            }
        } catch (error) {
            console.error('Error fetching health data:', error)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        fetchHealthData()
    }, [fetchHealthData])

    // Handle simulation changes
    const handleSimChange = (field: keyof FinancialData, value: number) => {
        if (!simData) return
        const newData = { ...simData, [field]: value }
        
        // Logical bounds:
        // Expenses cannot exceed Income
        if (newData.monthlyExpenses > newData.monthlyIncome) {
            newData.monthlyExpenses = newData.monthlyIncome
        }
        // Debt Payments cannot exceed Expenses (since they are a subset of expenses realistically)
        if (newData.monthlyDebtPayments > newData.monthlyExpenses) {
            newData.monthlyDebtPayments = newData.monthlyExpenses
        }
        
        // Auto-recalculate related fields if necessary (e.g. monthlySavings)
        newData.monthlySavings = newData.monthlyIncome - newData.monthlyExpenses
        
        setSimData(newData)
        setSimHealth(calculateFinHealthScore(newData))
    }

    const resetSimulation = () => {
        if (realData && realHealth) {
            setSimData(JSON.parse(JSON.stringify(realData)))
            setSimHealth(realHealth)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    if (!realData || !realHealth || !simData || !simHealth) return null

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto pb-20">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-indigo-500 dark:from-indigo-400 dark:to-indigo-300">
                        Pusat Kesehatan Finansial
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Simulasikan dan pelajari bagaimana skor Anda dihitung.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column: Current Score & Simulator Inputs */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Simulated Score Gauge */}
                    <div className="relative">
                        {(simData.monthlyIncome !== realData.monthlyIncome || simData.monthlyExpenses !== realData.monthlyExpenses || simData.monthlyDebtPayments !== realData.monthlyDebtPayments || simData.emergencyFund !== realData.emergencyFund) && (
                            <div className="absolute -top-3 -right-3 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10 animate-bounce shadow-lg flex items-center gap-1">
                                <Calculator className="h-3 w-3" /> Simulasi
                            </div>
                        )}
                        <FinancialScoreGauge 
                            score={simHealth.overallScore} 
                            status={simHealth.status} 
                            breakdown={{
                                savingsRate: simHealth.savingsRate.score,
                                emergencyFund: simHealth.emergencyFund.score,
                                dti: simHealth.dti.score,
                                budgetAdherence: simHealth.budgetAdherence.score,
                                investmentRatio: simHealth.investmentRatio.score
                            }} 
                        />
                    </div>

                    {/* What-If Simulator */}
                    <Card className="border-indigo-100 dark:border-indigo-900/50 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Activity className="h-32 w-32" />
                        </div>
                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
                            <CardTitle className="text-lg flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                                <TrendingUp className="h-5 w-5" />
                                What-If Simulator
                            </CardTitle>
                            <CardDescription>Ubah angka di bawah untuk melihat dampaknya pada skor Anda secara instan.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6 relative z-10">
                            {/* Pemasukan Bulanan */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <label>Pemasukan Bulanan</label>
                                    <span className="text-emerald-600">{formatCurrency(simData.monthlyIncome)}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min={0} max={Math.max((realData?.monthlyIncome || 10000000) * 3, 50000000)} step={100000}
                                    value={simData.monthlyIncome}
                                    onChange={(e) => handleSimChange('monthlyIncome', Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                            </div>

                            {/* Pengeluaran Bulanan */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <label>Pengeluaran Bulanan</label>
                                    <span className="text-rose-600">{formatCurrency(simData.monthlyExpenses)}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min={0} max={simData.monthlyIncome} step={100000}
                                    value={simData.monthlyExpenses}
                                    onChange={(e) => handleSimChange('monthlyExpenses', Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                                />
                            </div>

                            {/* Cicilan Utang */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <label>Total Cicilan Utang/Bulan</label>
                                    <span className="text-amber-600">{formatCurrency(simData.monthlyDebtPayments)}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min={0} max={simData.monthlyIncome} step={100000}
                                    value={simData.monthlyDebtPayments}
                                    onChange={(e) => handleSimChange('monthlyDebtPayments', Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                            </div>

                            {/* Dana Darurat (Total) */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <label>Tabungan Dana Darurat</label>
                                    <span className="text-blue-600">{formatCurrency(simData.emergencyFund)}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min={0} max={Math.max((realData?.totalAssets || 0) * 2, (simData.monthlyExpenses || 5000000) * 12, 50000000)} step={100000}
                                    value={simData.emergencyFund}
                                    onChange={(e) => handleSimChange('emergencyFund', Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>
                            
                            {(simData.monthlyIncome !== realData.monthlyIncome || simData.monthlyExpenses !== realData.monthlyExpenses || simData.monthlyDebtPayments !== realData.monthlyDebtPayments || simData.emergencyFund !== realData.emergencyFund) && (
                                <div className="pt-2">
                                    <Button onClick={resetSimulation} variant="outline" className="w-full text-xs">
                                        <RefreshCw className="h-3 w-3 mr-2" /> Kembalikan ke Data Asli
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Methodology & Educational Breakdown */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Burn Rate Alert */}
                    {(() => {
                        const payday = realData.paydayDate || 1;
                        const now = new Date();
                        const currentDay = now.getDate();
                        const currentMonth = now.getMonth();
                        const currentYear = now.getFullYear();

                        let lastPaydayDate = new Date(currentYear, currentMonth, payday);
                        let nextPaydayDate = new Date(currentYear, currentMonth + 1, payday);

                        if (currentDay < payday) {
                            lastPaydayDate = new Date(currentYear, currentMonth - 1, payday);
                            nextPaydayDate = new Date(currentYear, currentMonth, payday);
                        }

                        const totalDays = Math.max(1, (nextPaydayDate.getTime() - lastPaydayDate.getTime()) / (1000 * 60 * 60 * 24));
                        const daysPassed = Math.max(0, (now.getTime() - lastPaydayDate.getTime()) / (1000 * 60 * 60 * 24));
                        const daysLeft = Math.max(0, (nextPaydayDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        
                        const timeSpentPct = daysPassed / totalDays;
                        const moneySpentPct = realData.monthlyIncome > 0 ? (realData.monthlyExpenses / realData.monthlyIncome) : 0;

                        const isBoros = moneySpentPct > (timeSpentPct + 0.15); // 15% tolerance
                        const isSafe = moneySpentPct <= (timeSpentPct + 0.05);

                        return (
                            <Card className={`border-l-4 ${isBoros ? 'border-l-rose-500 bg-rose-50 dark:bg-rose-950/20' : isSafe ? 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20'}`}>
                                <CardContent className="p-5 flex items-start gap-4">
                                    {isBoros ? <AlertTriangle className="h-6 w-6 text-rose-500 mt-1 shrink-0" /> : isSafe ? <CheckCircle className="h-6 w-6 text-emerald-500 mt-1 shrink-0" /> : <Info className="h-6 w-6 text-amber-500 mt-1 shrink-0" />}
                                    <div className="space-y-2">
                                        <h4 className={`font-semibold ${isBoros ? 'text-rose-700 dark:text-rose-400' : isSafe ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                            {isBoros ? 'Peringatan: Pengeluaran Anda Terlalu Cepat (Boros)!' : isSafe ? 'Bagus! Kecepatan Pengeluaran Anda Terkendali.' : 'Perhatikan Kecepatan Pengeluaran Anda.'}
                                        </h4>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                            Gajian berikutnya dalam <strong>{Math.ceil(daysLeft)} hari</strong> (Tgl {payday}).<br/>
                                            Waktu sejak gajian lalu: <strong>{(timeSpentPct * 100).toFixed(0)}%</strong> berlalu, 
                                            tetapi Anda sudah menghabiskan <strong>{(moneySpentPct * 100).toFixed(0)}%</strong> dari total pemasukan.
                                        </p>
                                        {isBoros && (
                                            <p className="text-sm text-rose-600 font-medium">
                                                Saldo Anda berisiko habis sebelum waktu gajian tiba. Kurangi pengeluaran 'Wants' (keinginan) Anda sekarang!
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                                
                                {/* AI Analyst Persona */}
                                <div className="border-t border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 p-4 sm:p-5">
                                    <div className="flex gap-3 items-start">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                            <Bot className="h-4 w-4" />
                                        </div>
                                        <div className="space-y-2">
                                            <h5 className="font-semibold text-sm text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                                                AI Financial Analyst <Sparkles className="h-3 w-3 text-amber-500" />
                                            </h5>
                                            
                                            {(() => {
                                                const topWantsName = realData.topWantsCategory?.name || 'Keinginan';
                                                const topNeedsName = realData.topNeedsCategory?.name || 'Kebutuhan';
                                                const topWantsLower = topWantsName.toLowerCase();
                                                
                                                let borosCause = `pembengkakan pengeluaran terbesar bersumber dari <strong>${topWantsName}</strong>`;
                                                let borosAdvice1 = `Tunda sementara pengeluaran untuk <strong>${topWantsName}</strong> selama <strong>${Math.ceil(daysLeft)} hari</strong> ke depan.`;
                                                
                                                if (topWantsLower.includes('piutang') || topWantsLower.includes('pinjaman')) {
                                                    borosCause = `banyaknya uang kas yang keluar untuk <strong>Memberikan Pinjaman (Piutang)</strong>`;
                                                    borosAdvice1 = `Tunda sementara niat memberikan <strong>pinjaman / piutang</strong> kepada orang lain selama <strong>${Math.ceil(daysLeft)} hari</strong> ke depan. Amankan arus kas Anda sendiri terlebih dahulu!`;
                                                } else if (topWantsLower.includes('tagihan') || topWantsLower.includes('utang') || topWantsLower.includes('cicilan')) {
                                                    borosCause = `besarnya porsi pembayaran <strong>${topWantsName}</strong>`;
                                                    borosAdvice1 = `Fokus pada pelunasan yang mendesak, tapi JANGAN menambah beban utang baru selama <strong>${Math.ceil(daysLeft)} hari</strong> ke depan.`;
                                                }

                                                return isBoros ? (
                                                    <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                                                        <p>
                                                            Halo! Berdasarkan analisis data transaksi Anda, {borosCause} dengan total <strong>Rp{realData.topWantsCategory?.amount?.toLocaleString('id-ID') || 0}</strong>.
                                                        </p>
                                                        <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50 mt-2">
                                                            <strong className="text-indigo-800 dark:text-indigo-300">💡 Solusi & Saran:</strong>
                                                            <ul className="list-disc pl-4 mt-1 space-y-1">
                                                                <li dangerouslySetInnerHTML={{ __html: borosAdvice1 }}></li>
                                                                <li>Fokuskan sisa saldo Anda HANYA untuk menopang kebutuhan esensial seperti <strong>{topNeedsName}</strong>.</li>
                                                                <li>Jika Anda menggunakan Paylater atau Kartu Kredit, hentikan penggunaannya bulan ini untuk mencegah defisit berkelanjutan.</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                ) : isSafe ? (
                                                    <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                                                        <p>
                                                            Luar biasa! Manajemen arus kas Anda sangat sehat. Anda berhasil menekan pengeluaran <strong>{topWantsName}</strong> Anda di angka yang wajar (Rp{realData.topWantsCategory?.amount?.toLocaleString('id-ID') || 0}).
                                                        </p>
                                                        <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50 mt-2">
                                                            <strong className="text-indigo-800 dark:text-indigo-300">💡 Saran Lanjutan:</strong>
                                                            <ul className="list-disc pl-4 mt-1 space-y-1">
                                                                <li>Pertahankan ritme ini selama <strong>{Math.ceil(daysLeft)} hari</strong> ke depan.</li>
                                                                <li>Jika di akhir siklus gajian nanti masih ada sisa uang bulanan, segera alokasikan ke <strong>Dana Darurat</strong> atau <strong>Investasi</strong> sebelum gajian berikutnya masuk!</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                                                        <p>
                                                            Halo! Arus kas Anda saat ini sedang berada di ambang batas wajar. Kebutuhan terbesar Anda ada di <strong>{topNeedsName}</strong> (Rp{realData.topNeedsCategory?.amount?.toLocaleString('id-ID') || 0}), sedangkan pengeluaran sekunder terbesar ada di <strong>{topWantsName}</strong>.
                                                        </p>
                                                        <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50 mt-2">
                                                            <strong className="text-indigo-800 dark:text-indigo-300">💡 Saran Penyesuaian:</strong>
                                                            <ul className="list-disc pl-4 mt-1 space-y-1">
                                                                <li>Berhati-hatilah agar pengeluaran sekunder (Wants) tidak melebar di <strong>{Math.ceil(daysLeft)} hari</strong> terakhir ini.</li>
                                                                <li>Catat setiap transaksi sekecil apapun agar Anda tidak melewati batas aman sebelum gajian tiba.</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })()}

                    <Card className="shadow-sm">
                        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-indigo-500" />
                                Metodologi & Edukasi
                            </CardTitle>
                            <CardDescription>
                                Transparansi penuh bagaimana skor Anda (atau simulasi Anda) dihitung. Ketuk setiap poin untuk mempelajari rumusnya.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 p-0 sm:p-6">
                            <div className="space-y-4">
                                {/* 1. Rasio Tabungan */}
                                <details className="group border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                                    <summary className="flex items-center justify-between p-4 font-medium cursor-pointer bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                <PiggyBank className="h-4 w-4" />
                                            </div>
                                            <span>Rasio Tabungan (Bobot 30%)</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-sm font-bold ${simHealth.savingsRate.score >= 60 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                Skor: {simHealth.savingsRate.score}/100
                                            </span>
                                            <span className="text-slate-400 group-open:rotate-90 transition-transform">▶</span>
                                        </div>
                                    </summary>
                                    <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 text-sm space-y-4">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                            Rumus: (Pemasukan - Pengeluaran) / Pemasukan
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-muted-foreground mb-1">Perhitungan Saat Ini:</p>
                                                <p className="font-semibold text-base">
                                                    ({formatCurrency(simData.monthlyIncome)} - {formatCurrency(simData.monthlyExpenses)}) / {formatCurrency(simData.monthlyIncome)} 
                                                    <br/>= <span className="text-emerald-600">{(simHealth.savingsRate.value * 100).toFixed(1)}%</span>
                                                </p>
                                            </div>
                                            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
                                                <p className="font-semibold text-blue-800 dark:text-blue-400 mb-1 flex items-center gap-1"><Info className="h-3 w-3"/> Standar Ideal:</p>
                                                <p className="text-blue-700 dark:text-blue-300 text-xs">Menyisihkan <strong>&gt;20%</strong> dari pendapatan (Sesuai Aturan 50/30/20). Jika di bawah 10%, skor akan turun drastis.</p>
                                            </div>
                                        </div>
                                        {simHealth.savingsRate.score < 80 && (
                                            <div className="pt-2">
                                                <Button variant="outline" size="sm" asChild className="text-xs">
                                                    <Link href="/goals">Buat Target Tabungan Baru</Link>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </details>

                                {/* 2. Rasio Utang (DTI) */}
                                <details className="group border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                                    <summary className="flex items-center justify-between p-4 font-medium cursor-pointer bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                                                <CreditCard className="h-4 w-4" />
                                            </div>
                                            <span>Rasio Cicilan Utang (DTI) (Bobot 20%)</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-sm font-bold ${simHealth.dti.score >= 60 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                Skor: {simHealth.dti.score}/100
                                            </span>
                                            <span className="text-slate-400 group-open:rotate-90 transition-transform">▶</span>
                                        </div>
                                    </summary>
                                    <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 text-sm space-y-4">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                            Rumus: Total Cicilan Bulanan / Total Pemasukan Bulanan
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-muted-foreground mb-1">Perhitungan Saat Ini:</p>
                                                <p className="font-semibold text-base">
                                                    {formatCurrency(simData.monthlyDebtPayments)} / {formatCurrency(simData.monthlyIncome)} 
                                                    <br/>= <span className={simHealth.dti.value > 0.36 ? 'text-rose-600' : 'text-emerald-600'}>{(simHealth.dti.value * 100).toFixed(1)}%</span>
                                                </p>
                                            </div>
                                            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
                                                <p className="font-semibold text-blue-800 dark:text-blue-400 mb-1 flex items-center gap-1"><Info className="h-3 w-3"/> Standar Ideal:</p>
                                                <p className="text-blue-700 dark:text-blue-300 text-xs">Total beban cicilan utang maksimal <strong>30% - 36%</strong> dari pendapatan bersih. Lebih dari 43% dianggap sangat berisiko (Red Flag).</p>
                                            </div>
                                        </div>
                                        {simHealth.dti.score < 80 && (
                                            <div className="pt-2 flex gap-2">
                                                <Button variant="outline" size="sm" asChild className="text-xs">
                                                    <Link href="/debts">Kelola Utang Anda</Link>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </details>

                                {/* 3. Dana Darurat */}
                                <details className="group border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                                    <summary className="flex items-center justify-between p-4 font-medium cursor-pointer bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                                <Target className="h-4 w-4" />
                                            </div>
                                            <span>Dana Darurat (Bobot 25%)</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-sm font-bold ${simHealth.emergencyFund.score >= 60 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                Skor: {simHealth.emergencyFund.score}/100
                                            </span>
                                            <span className="text-slate-400 group-open:rotate-90 transition-transform">▶</span>
                                        </div>
                                    </summary>
                                    <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 text-sm space-y-4">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                            Rumus: Saldo Dompet 'Darurat' / Rata-rata Pengeluaran Bulanan
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-muted-foreground mb-1">Perhitungan Saat Ini:</p>
                                                <p className="font-semibold text-base">
                                                    {formatCurrency(simData.emergencyFund)} / {formatCurrency(simData.avgMonthlyExpenses || simData.monthlyExpenses)} 
                                                    <br/>= <span className={simHealth.emergencyFund.value < 3 ? 'text-rose-600' : 'text-emerald-600'}>{simHealth.emergencyFund.value.toFixed(1)} Bulan</span>
                                                </p>
                                            </div>
                                            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
                                                <p className="font-semibold text-blue-800 dark:text-blue-400 mb-1 flex items-center gap-1"><Info className="h-3 w-3"/> Standar Ideal:</p>
                                                <p className="text-blue-700 dark:text-blue-300 text-xs">Memiliki dana setara <strong>3 hingga 6 bulan</strong> pengeluaran rutin Anda. Ini untuk berjaga-jaga jika terjadi kehilangan pekerjaan atau krisis medis.</p>
                                            </div>
                                        </div>
                                        {simHealth.emergencyFund.score < 80 && (
                                            <div className="pt-2">
                                                <Button variant="outline" size="sm" asChild className="text-xs">
                                                    <Link href="/wallets">Buat Dompet Khusus 'Darurat'</Link>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </details>

                            </div>
                            
                            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-xs text-muted-foreground flex items-start gap-3">
                                <Info className="h-5 w-5 shrink-0 text-slate-400" />
                                <p>Skor Kesehatan Finansial ini menggunakan algoritma kepemilikan eksklusif yang diadaptasi dari standar <strong>Financial Health Network (FinHealth Score®)</strong>, Aturan 50/30/20 dari Elizabeth Warren, serta teori pengelolaan utang standar CFPB. Pastikan Anda mencatat transaksi dengan disiplin untuk mendapatkan nilai yang akurat.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
