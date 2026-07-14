'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart3, TrendingUp, TrendingDown, PieChart as PieChartIcon, ArrowRightLeft, Wallet, Calendar, Tag, FileText, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { formatCurrency } from '@/lib/utils'

// Format tooltip values
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border rounded-lg shadow-lg p-4">
                <p className="font-medium mb-2">{label}</p>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
                        {entry.name === 'income' ? 'Pemasukan' : entry.name === 'expense' ? 'Pengeluaran' : entry.name}: {formatCurrency(entry.value)}
                    </p>
                ))}
            </div>
        )
    }
    return null
}

export default function ReportsPage() {
    const { user } = useAuthStore()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense')
    const [isRefreshing, setIsRefreshing] = useState(false)

    const fetchData = async () => {
        if (!user) return
        try {
            const res = await fetch(`/api/reports/monthly-summary?userId=${user.id}`)
            if (res.ok) {
                const json = await res.json()
                setData(json)
            }
        } catch (error) {
            console.error("Failed to fetch reports:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetchData()
        setIsRefreshing(false)
    }

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-10 bg-muted rounded w-1/4 mb-4"></div>
                <div className="grid md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Card key={i}><CardHeader className="h-24 bg-muted/50 rounded-t-lg" /></Card>)}
                </div>
                <div className="h-[400px] bg-muted/30 rounded-lg"></div>
            </div>
        )
    }

    if (!data) return <p className="text-muted-foreground">Gagal memuat data laporan.</p>

    const { summary, history, expensesByCategory, transactions = [] } = data

    // Filter transactions based on active tab
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filteredTransactions = transactions.filter((t: any) => t.type === activeTab)
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Laporan Keuangan</h1>
                    <p className="text-muted-foreground mt-1">Analisis komprehensif arus kas dan pengeluaran Anda</p>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh Laporan
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-500/10 via-background to-background border-green-500/20 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
                            <TrendingUp className="h-4 w-4" />
                            Total Pemasukan Bulan Ini
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 truncate">{formatCurrency(summary.totalIncome)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Dari {summary.transactionCount.income} transaksi</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500/10 via-background to-background border-red-500/20 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                            <TrendingDown className="h-4 w-4" />
                            Total Pengeluaran Bulan Ini
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 truncate">{formatCurrency(summary.totalExpenses)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Dari {summary.transactionCount.expense} transaksi</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 via-background to-background border-blue-500/20 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-600">
                            <PieChartIcon className="h-4 w-4" />
                            Savings Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 truncate">{summary.savingsRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Persentase uang yang ditabung</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 via-background to-background border-purple-500/20 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-600">
                            <ArrowRightLeft className="h-4 w-4" />
                            Volume Transfer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 truncate">{formatCurrency(summary.totalTransfers)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Dari {summary.transactionCount.transfer} transaksi</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Bar Chart 6 Months */}
                <Card className="col-span-1 border-muted shadow-sm hover:shadow-md transition-all">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Riwayat 6 Bulan Terakhir
                        </CardTitle>
                        <CardDescription>Perbandingan Pemasukan dan Pengeluaran</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.2} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `Rp${(val/1000).toLocaleString('id-ID')}k`} tick={{ fontSize: 12 }} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                                    <Bar dataKey="income" name="Pemasukan" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="expense" name="Pengeluaran" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Pie Chart Expense by Category */}
                <Card className="col-span-1 border-muted shadow-sm hover:shadow-md transition-all">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <PieChartIcon className="h-5 w-5 text-primary" />
                            Pengeluaran per Kategori
                        </CardTitle>
                        <CardDescription>Distribusi pengeluaran bulan ini</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {expensesByCategory && expensesByCategory.length > 0 ? (
                            <div className="h-[350px] w-full mt-4 flex flex-col justify-center items-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={expensesByCategory}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={3}
                                            dataKey="amount"
                                            stroke="none"
                                        >
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {expensesByCategory.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend 
                                            layout="horizontal" 
                                            verticalAlign="bottom" 
                                            align="center"
                                            wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[350px] flex flex-col items-center justify-center text-muted-foreground text-center">
                                <PieChartIcon className="h-16 w-16 mb-4 opacity-20" />
                                <p>Belum ada data pengeluaran bulan ini</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Transaction Details */}
            <Card className="border-muted shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Rincian Transaksi</CardTitle>
                    <CardDescription>Detail pengeluaran dan pemasukan bulan ini</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Custom Tabs */}
                    <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg w-full max-w-md mb-6">
                        <button
                            onClick={() => setActiveTab('expense')}
                            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                                activeTab === 'expense' 
                                ? 'bg-background text-foreground shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Pengeluaran
                        </button>
                        <button
                            onClick={() => setActiveTab('income')}
                            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                                activeTab === 'income' 
                                ? 'bg-background text-foreground shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Pemasukan
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Tanggal</th>
                                    <th className="px-4 py-3">Kategori</th>
                                    <th className="px-4 py-3">Deskripsi</th>
                                    <th className="px-4 py-3">Dompet</th>
                                    <th className="px-4 py-3 text-right rounded-tr-lg">Nominal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.length > 0 ? (
                                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                                    filteredTransactions.map((tx: any) => (
                                        <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {new Date(tx.date).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div 
                                                        className="w-3 h-3 rounded-full" 
                                                        style={{ backgroundColor: tx.category?.color || '#cbd5e1' }}
                                                    />
                                                    <span className="font-medium">{tx.category?.name || 'Tanpa Kategori'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 max-w-[200px] truncate">
                                                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                    <span className="truncate" title={tx.description || '-'}>
                                                        {tx.description || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                                    {tx.wallet?.name || '-'}
                                                </div>
                                            </td>
                                            <td className={`px-4 py-3 text-right font-semibold ${
                                                tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                            Tidak ada data {activeTab === 'expense' ? 'pengeluaran' : 'pemasukan'} untuk bulan ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}