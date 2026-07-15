'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import {
    Plus,
    CreditCard,
    Trash2,
    Edit,
    AlertTriangle,
    TrendingDown,
    Calendar,
    Percent,
    RefreshCw,
    BadgePercent,
    Banknote,
    Car,
    Home,
    ShoppingBag,
    Smartphone,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Debt {
    id: string
    name: string
    type: string
    totalAmount: number
    remainingAmount: number
    monthlyPayment: number
    interestRate: number | null
    dueDate: string | null
    createdAt: string
}

interface DebtSummary {
    totalRemainingAmount: number
    totalMonthlyPayment: number
    totalOriginalAmount: number
    count: number
}

const DEBT_TYPES = [
    { value: 'kpr', label: 'KPR (Kredit Pemilikan Rumah)', icon: Home, color: 'text-blue-600', bg: 'bg-blue-100' },
    { value: 'kta', label: 'KTA (Kredit Tanpa Agunan)', icon: Banknote, color: 'text-purple-600', bg: 'bg-purple-100' },
    { value: 'kartu_kredit', label: 'Kartu Kredit', icon: CreditCard, color: 'text-red-600', bg: 'bg-red-100' },
    { value: 'cicilan_kendaraan', label: 'Cicilan Kendaraan', icon: Car, color: 'text-amber-600', bg: 'bg-amber-100' },
    { value: 'pinjol', label: 'Pinjaman Online (Pinjol)', icon: Smartphone, color: 'text-orange-600', bg: 'bg-orange-100' },
    { value: 'cicilan_barang', label: 'Cicilan Barang/Elektronik', icon: ShoppingBag, color: 'text-teal-600', bg: 'bg-teal-100' },
    { value: 'lainnya', label: 'Utang Lainnya', icon: BadgePercent, color: 'text-gray-600', bg: 'bg-gray-100' },
]

const getDebtTypeInfo = (type: string) => {
    return DEBT_TYPES.find(t => t.value === type) || DEBT_TYPES[DEBT_TYPES.length - 1]
}

const EMPTY_FORM = {
    name: '',
    type: 'kartu_kredit',
    totalAmount: '',
    remainingAmount: '',
    monthlyPayment: '',
    interestRate: '',
    dueDate: '',
}

export default function DebtsPage() {
    const { data: session } = useSession()
    const user = session?.user
    const { toast } = useToast()

    const [debts, setDebts] = useState<Debt[]>([])
    const [summary, setSummary] = useState<DebtSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const [showForm, setShowForm] = useState(false)
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)

    const fetchDebts = useCallback(async () => {
        if (!user?.id) return
        try {
            const res = await fetch('/api/debts')
            if (res.ok) {
                const data = await res.json()
                setDebts(data.debts || [])
                setSummary(data.summary)
            }
        } catch (error) {
            console.error('Error fetching debts:', error)
            toast({ title: 'Error', description: 'Gagal memuat data utang', variant: 'destructive' })
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }, [user, toast])

    useEffect(() => {
        const timer = setTimeout(() => fetchDebts(), 0)
        return () => clearTimeout(timer)
    }, [fetchDebts])

    const handleRefresh = () => {
        setIsRefreshing(true)
        fetchDebts()
    }

    const openAddForm = () => {
        setEditingDebt(null)
        setForm(EMPTY_FORM)
        setShowForm(true)
    }

    const openEditForm = (debt: Debt) => {
        setEditingDebt(debt)
        setForm({
            name: debt.name,
            type: debt.type,
            totalAmount: debt.totalAmount.toString(),
            remainingAmount: debt.remainingAmount.toString(),
            monthlyPayment: debt.monthlyPayment.toString(),
            interestRate: debt.interestRate?.toString() || '',
            dueDate: debt.dueDate ? new Date(debt.dueDate).toISOString().split('T')[0] : '',
        })
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.id) return
        setIsSubmitting(true)

        const payload = {
            name: form.name,
            type: form.type,
            totalAmount: form.totalAmount.replace(/\D/g, ''),
            remainingAmount: form.remainingAmount.replace(/\D/g, ''),
            monthlyPayment: form.monthlyPayment.replace(/\D/g, ''),
            interestRate: form.interestRate || null,
            dueDate: form.dueDate || null,
        }

        try {
            const url = editingDebt ? `/api/debts/${editingDebt.id}` : '/api/debts'
            const method = editingDebt ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Terjadi kesalahan')
            }

            toast({
                title: 'Berhasil',
                description: editingDebt ? 'Data utang berhasil diperbarui' : 'Utang baru berhasil ditambahkan',
            })
            setShowForm(false)
            fetchDebts()
        } catch (error: unknown) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Gagal menyimpan data',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (debt: Debt) => {
        if (!confirm(`Hapus utang "${debt.name}"? Aksi ini tidak dapat dibatalkan.`)) return
        try {
            const res = await fetch(`/api/debts/${debt.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error()
            toast({ title: 'Berhasil', description: 'Utang berhasil dihapus' })
            fetchDebts()
        } catch {
            toast({ title: 'Error', description: 'Gagal menghapus utang', variant: 'destructive' })
        }
    }

    // Helper to format raw number input
    const formatNumber = (raw: string) => {
        const num = raw.replace(/\D/g, '')
        return num ? parseInt(num).toLocaleString('id-ID') : ''
    }

    const setFormField = (field: keyof typeof EMPTY_FORM, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const paidOffPercent = (debt: Debt) => {
        const paid = debt.totalAmount - debt.remainingAmount
        return Math.min(Math.round((paid / debt.totalAmount) * 100), 100)
    }

    const monthsToPayOff = (debt: Debt) => {
        if (debt.monthlyPayment <= 0) return null
        return Math.ceil(debt.remainingAmount / debt.monthlyPayment)
    }

    const totalPaidOff = summary ? summary.totalOriginalAmount - summary.totalRemainingAmount : 0
    const [thirtyDaysFromNow, setThirtyDaysFromNow] = useState<Date | null>(null)

    useEffect(() => {
        setThirtyDaysFromNow(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    }, [])

    return (
        <div className="p-4 sm:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Utang & Cicilan</h1>
                    <p className="text-muted-foreground mt-1">
                        Pantau dan kelola semua kewajiban finansial Anda
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing || loading}
                        className="gap-2"
                    >
                        <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>
                    <Button onClick={openAddForm} className="gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-md">
                        <Plus className="h-4 w-4" />
                        Tambah Utang
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-red-500/10 to-background border-red-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-1.5">
                                <TrendingDown className="h-4 w-4" /> Total Sisa Utang
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(summary.totalRemainingAmount)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Dari {formatCurrency(summary.totalOriginalAmount)} total</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-500/10 to-background border-orange-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" /> Cicilan/Bulan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold text-orange-600">{formatCurrency(summary.totalMonthlyPayment)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Total kewajiban bulanan</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-500/10 to-background border-green-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-1.5">
                                <Percent className="h-4 w-4" /> Sudah Terlunasi
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(totalPaidOff)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Dari seluruh utang</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-500/10 to-background border-blue-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-1.5">
                                <CreditCard className="h-4 w-4" /> Jumlah Utang
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold text-blue-600">{summary.count} <span className="text-sm font-normal text-muted-foreground">item</span></div>
                            <p className="text-xs text-muted-foreground mt-1">Kewajiban aktif</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Debt List */}
            {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="h-40 bg-muted/30 rounded-xl" />
                        </Card>
                    ))}
                </div>
            ) : debts.length === 0 ? (
                <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-5">
                            <CreditCard className="h-10 w-10 text-red-400" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Tidak ada utang tercatat</h3>
                        <p className="text-muted-foreground max-w-sm mb-6">
                            Catat utang dan cicilan Anda agar Financial Health Score akurat dan terpantau dengan baik.
                        </p>
                        <Button onClick={openAddForm} className="gap-2">
                            <Plus className="h-4 w-4" /> Tambah Utang Pertama
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {debts.map((debt, index) => {
                        const typeInfo = getDebtTypeInfo(debt.type)
                        const TypeIcon = typeInfo.icon
                        const paidPct = paidOffPercent(debt)
                        const months = monthsToPayOff(debt)
                        const isAlmostDue = debt.dueDate && thirtyDaysFromNow &&
                            new Date(debt.dueDate) < thirtyDaysFromNow

                        return (
                            <Card
                                key={debt.id}
                                className="overflow-hidden hover:shadow-lg transition-all duration-300 group"
                                style={{
                                    animation: `slideUp 0.4s ease-out ${index * 80}ms both`,
                                }}
                            >
                                <CardContent className="p-0">
                                    {/* Header strip */}
                                    <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', typeInfo.bg)}>
                                                <TypeIcon className={cn('h-5 w-5', typeInfo.color)} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-base leading-tight">{debt.name}</h3>
                                                <p className="text-xs text-muted-foreground mt-0.5">{typeInfo.label}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-primary/10"
                                                onClick={() => openEditForm(debt)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-red-100 text-red-500"
                                                onClick={() => handleDelete(debt)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="px-5 pt-4 pb-2">
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="text-muted-foreground">Progress Pelunasan</span>
                                            <span className={cn('font-bold', paidPct >= 75 ? 'text-green-600' : paidPct >= 50 ? 'text-blue-600' : 'text-orange-600')}>
                                                {paidPct}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={paidPct}
                                            className="h-2.5"
                                            indicatorClassName={cn(
                                                'transition-all duration-700',
                                                paidPct >= 75 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                                paidPct >= 50 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                                                'bg-gradient-to-r from-orange-400 to-red-500'
                                            )}
                                        />
                                    </div>

                                    {/* Amounts */}
                                    <div className="grid grid-cols-2 gap-3 px-5 py-3 bg-muted/30">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Sisa Utang</p>
                                            <p className="font-bold text-red-600">{formatCurrency(debt.remainingAmount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Cicilan/Bulan</p>
                                            <p className="font-bold">{formatCurrency(debt.monthlyPayment)}</p>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            {debt.interestRate && (
                                                <span className="flex items-center gap-1">
                                                    <Percent className="h-3 w-3" />
                                                    {debt.interestRate}% / tahun
                                                </span>
                                            )}
                                            {months && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    ~{months} bulan lagi
                                                </span>
                                            )}
                                        </div>
                                        {isAlmostDue && (
                                            <span className="flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded-full">
                                                <AlertTriangle className="h-3 w-3" />
                                                Jatuh Tempo
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Animation keyframes */}
            <style jsx global>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* Add/Edit Dialog */}
            <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditingDebt(null) }}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>{editingDebt ? 'Edit Data Utang' : 'Tambah Utang Baru'}</DialogTitle>
                        <DialogDescription>
                            {editingDebt
                                ? 'Perbarui informasi utang Anda'
                                : 'Catat kewajiban finansial untuk memantau kesehatan keuangan'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1.5">
                                <Label>Nama Utang/Kredit</Label>
                                <Input
                                    required
                                    value={form.name}
                                    onChange={e => setFormField('name', e.target.value)}
                                    placeholder="Contoh: KPR Rumah Cilandak, Kartu Kredit BCA"
                                />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label>Jenis Utang</Label>
                                <Select value={form.type} onValueChange={v => setFormField('type', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {DEBT_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Total Utang Awal (Rp)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground font-medium text-sm">Rp</span>
                                    <Input
                                        required
                                        className="pl-9"
                                        value={formatNumber(form.totalAmount)}
                                        onChange={e => setFormField('totalAmount', e.target.value.replace(/\D/g, ''))}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Sisa Utang Saat Ini (Rp)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground font-medium text-sm">Rp</span>
                                    <Input
                                        required
                                        className="pl-9"
                                        value={formatNumber(form.remainingAmount)}
                                        onChange={e => setFormField('remainingAmount', e.target.value.replace(/\D/g, ''))}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Cicilan per Bulan (Rp)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground font-medium text-sm">Rp</span>
                                    <Input
                                        required
                                        className="pl-9"
                                        value={formatNumber(form.monthlyPayment)}
                                        onChange={e => setFormField('monthlyPayment', e.target.value.replace(/\D/g, ''))}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Bunga per Tahun (%) <span className="text-muted-foreground font-normal">– Opsional</span></Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={form.interestRate}
                                        onChange={e => setFormField('interestRate', e.target.value)}
                                        placeholder="Contoh: 12.5"
                                    />
                                    <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">%</span>
                                </div>
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label>Tanggal Jatuh Tempo <span className="text-muted-foreground font-normal">– Opsional</span></Label>
                                <Input
                                    type="date"
                                    value={form.dueDate}
                                    onChange={e => setFormField('dueDate', e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                            >
                                {isSubmitting ? 'Menyimpan...' : editingDebt ? 'Simpan Perubahan' : 'Tambah Utang'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
