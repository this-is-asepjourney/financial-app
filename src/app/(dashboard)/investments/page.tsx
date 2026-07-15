'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    TrendingUp,
    TrendingDown,
    Trash2,
    Edit,
    RefreshCw,
    BarChart2,
    PiggyBank,
    Bitcoin,
    Landmark,
    Building2,
    Package,
    ChevronRight,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Investment {
    id: string
    name: string
    type: string
    amount: number
    currentValue: number | null
    returns: number | null
    startDate: string
    notes: string | null
    createdAt: string
}

interface InvestmentSummary {
    totalCurrentValue: number
    totalCost: number
    count: number
}

const INVESTMENT_TYPES = [
    { value: 'stocks', label: 'Saham', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100', gradient: 'from-blue-500 to-indigo-600' },
    { value: 'mutual_fund', label: 'Reksa Dana', icon: BarChart2, color: 'text-purple-600', bg: 'bg-purple-100', gradient: 'from-purple-500 to-violet-600' },
    { value: 'crypto', label: 'Crypto', icon: Bitcoin, color: 'text-amber-600', bg: 'bg-amber-100', gradient: 'from-amber-500 to-orange-500' },
    { value: 'deposit', label: 'Deposito / Tabungan', icon: Landmark, color: 'text-green-600', bg: 'bg-green-100', gradient: 'from-green-500 to-emerald-600' },
    { value: 'property', label: 'Properti', icon: Building2, color: 'text-teal-600', bg: 'bg-teal-100', gradient: 'from-teal-500 to-cyan-600' },
    { value: 'other', label: 'Lainnya', icon: Package, color: 'text-gray-600', bg: 'bg-gray-100', gradient: 'from-gray-500 to-slate-600' },
]

const getTypeInfo = (type: string) =>
    INVESTMENT_TYPES.find(t => t.value === type) || INVESTMENT_TYPES[INVESTMENT_TYPES.length - 1]

const EMPTY_FORM = {
    name: '',
    type: 'stocks',
    amount: '',
    currentValue: '',
    returns: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
}

export default function InvestmentsPage() {
    const { data: session } = useSession()
    const user = session?.user
    const { toast } = useToast()

    const [investments, setInvestments] = useState<Investment[]>([])
    const [summary, setSummary] = useState<InvestmentSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const [showForm, setShowForm] = useState(false)
    const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)

    const fetchInvestments = useCallback(async () => {
        if (!user?.id) return
        try {
            const res = await fetch('/api/investments')
            if (res.ok) {
                const data = await res.json()
                setInvestments(data.investments || [])
                setSummary(data.summary)
            }
        } catch (error) {
            console.error('Error fetching investments:', error)
            toast({ title: 'Error', description: 'Gagal memuat data investasi', variant: 'destructive' })
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }, [user, toast])

    useEffect(() => {
        const timer = setTimeout(() => fetchInvestments(), 0)
        return () => clearTimeout(timer)
    }, [fetchInvestments])

    const handleRefresh = () => { setIsRefreshing(true); fetchInvestments() }

    const openAddForm = () => {
        setEditingInvestment(null)
        setForm(EMPTY_FORM)
        setShowForm(true)
    }

    const openEditForm = (inv: Investment) => {
        setEditingInvestment(inv)
        setForm({
            name: inv.name,
            type: inv.type,
            amount: inv.amount.toString(),
            currentValue: inv.currentValue?.toString() || '',
            returns: inv.returns?.toString() || '',
            startDate: new Date(inv.startDate).toISOString().split('T')[0],
            notes: inv.notes || '',
        })
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        const payload = {
            name: form.name,
            type: form.type,
            amount: form.amount.replace(/\D/g, ''),
            currentValue: form.currentValue.replace(/\D/g, '') || null,
            returns: form.returns || null,
            startDate: form.startDate,
            notes: form.notes || null,
        }

        try {
            const url = editingInvestment ? `/api/investments/${editingInvestment.id}` : '/api/investments'
            const method = editingInvestment ? 'PUT' : 'POST'
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
                description: editingInvestment ? 'Investasi berhasil diperbarui' : 'Investasi baru berhasil ditambahkan',
            })
            setShowForm(false)
            fetchInvestments()
        } catch (error: unknown) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Gagal menyimpan',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (inv: Investment) => {
        if (!confirm(`Hapus investasi "${inv.name}"?`)) return
        try {
            const res = await fetch(`/api/investments/${inv.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error()
            toast({ title: 'Berhasil', description: 'Investasi berhasil dihapus' })
            fetchInvestments()
        } catch {
            toast({ title: 'Error', description: 'Gagal menghapus', variant: 'destructive' })
        }
    }

    const formatNumber = (raw: string) => {
        const num = raw.replace(/\D/g, '')
        return num ? parseInt(num).toLocaleString('id-ID') : ''
    }

    const setFormField = (field: keyof typeof EMPTY_FORM, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const totalReturn = summary ? summary.totalCurrentValue - summary.totalCost : 0
    const totalReturnPct = summary && summary.totalCost > 0
        ? ((summary.totalCurrentValue - summary.totalCost) / summary.totalCost) * 100
        : 0

    return (
        <div className="p-4 sm:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Portofolio Investasi</h1>
                    <p className="text-muted-foreground mt-1">
                        Kelola dan pantau pertumbuhan aset investasi Anda
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
                    <Button
                        onClick={openAddForm}
                        className="gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Investasi
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-teal-500/10 to-background border-teal-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-teal-600 flex items-center gap-1.5">
                                <TrendingUp className="h-4 w-4" /> Nilai Portofolio
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold text-teal-600">{formatCurrency(summary.totalCurrentValue)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Nilai saat ini</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-500/10 to-background border-blue-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-1.5">
                                <PiggyBank className="h-4 w-4" /> Total Modal
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold text-blue-600">{formatCurrency(summary.totalCost)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Investasi awal</p>
                        </CardContent>
                    </Card>
                    <Card className={cn(
                        'bg-gradient-to-br to-background',
                        totalReturn >= 0 ? 'from-green-500/10 border-green-500/20' : 'from-red-500/10 border-red-500/20'
                    )}>
                        <CardHeader className="pb-2">
                            <CardTitle className={cn('text-sm font-medium flex items-center gap-1.5',
                                totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                                {totalReturn >= 0
                                    ? <TrendingUp className="h-4 w-4" />
                                    : <TrendingDown className="h-4 w-4" />}
                                Total Return
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={cn('text-xl sm:text-2xl font-bold', totalReturn >= 0 ? 'text-green-600' : 'text-red-600')}>
                                {totalReturn >= 0 ? '+' : ''}{formatCurrency(totalReturn)}
                            </div>
                            <p className={cn('text-xs font-medium mt-1', totalReturn >= 0 ? 'text-green-500' : 'text-red-500')}>
                                {totalReturn >= 0 ? '+' : ''}{totalReturnPct.toFixed(2)}%
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-500/10 to-background border-purple-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-purple-600 flex items-center gap-1.5">
                                <BarChart2 className="h-4 w-4" /> Instrumen
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold text-purple-600">{summary.count} <span className="text-sm font-normal text-muted-foreground">item</span></div>
                            <p className="text-xs text-muted-foreground mt-1">Diversifikasi aktif</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Investment List */}
            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="h-48 bg-muted/30 rounded-xl" />
                        </Card>
                    ))}
                </div>
            ) : investments.length === 0 ? (
                <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mb-5">
                            <TrendingUp className="h-10 w-10 text-teal-400" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Belum ada investasi tercatat</h3>
                        <p className="text-muted-foreground max-w-sm mb-6">
                            Mulai catat portofolio investasi Anda — saham, reksa dana, crypto, deposito, dan lainnya.
                        </p>
                        <Button onClick={openAddForm} className="gap-2 bg-teal-600 hover:bg-teal-700">
                            <Plus className="h-4 w-4" /> Tambah Investasi Pertama
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {investments.map((inv, index) => {
                        const typeInfo = getTypeInfo(inv.type)
                        const TypeIcon = typeInfo.icon
                        const currentVal = inv.currentValue ?? inv.amount
                        const returnAmt = currentVal - inv.amount
                        const returnPct = inv.amount > 0 ? (returnAmt / inv.amount) * 100 : 0
                        const isProfit = returnAmt >= 0

                        return (
                            <Card
                                key={inv.id}
                                className="overflow-hidden hover:shadow-lg transition-all duration-300 group"
                                style={{ animation: `slideUp 0.4s ease-out ${index * 80}ms both` }}
                            >
                                <CardContent className="p-0">
                                    {/* Gradient Header */}
                                    <div className={cn('p-5 bg-gradient-to-br text-white relative overflow-hidden', typeInfo.gradient)}>
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                                        <div className="flex items-start justify-between relative">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                                    <TypeIcon className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-base leading-tight">{inv.name}</h3>
                                                    <p className="text-xs text-white/70 mt-0.5">{typeInfo.label}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center"
                                                    onClick={() => openEditForm(inv)}
                                                >
                                                    <Edit className="h-3.5 w-3.5 text-white" />
                                                </button>
                                                <button
                                                    className="w-7 h-7 bg-white/20 hover:bg-red-400/50 rounded-lg flex items-center justify-center"
                                                    onClick={() => handleDelete(inv)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-white" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-xs text-white/60">Nilai Saat Ini</p>
                                            <p className="text-2xl font-bold">{formatCurrency(currentVal)}</p>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Modal Awal</p>
                                                <p className="font-semibold">{formatCurrency(inv.amount)}</p>
                                            </div>
                                            <div className={cn(
                                                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold',
                                                isProfit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            )}>
                                                {isProfit
                                                    ? <TrendingUp className="h-3.5 w-3.5" />
                                                    : <TrendingDown className="h-3.5 w-3.5" />}
                                                {isProfit ? '+' : ''}{returnPct.toFixed(2)}%
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-gray-100 dark:border-gray-700">
                                            <span>Mulai: {new Date(inv.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            {inv.notes && (
                                                <span className="flex items-center gap-1 truncate max-w-[120px]">
                                                    <ChevronRight className="h-3 w-3 flex-shrink-0" />
                                                    <span className="truncate" title={inv.notes}>{inv.notes}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            <style jsx global>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* Add/Edit Dialog */}
            <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditingInvestment(null) }}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>{editingInvestment ? 'Edit Investasi' : 'Tambah Investasi Baru'}</DialogTitle>
                        <DialogDescription>
                            {editingInvestment ? 'Perbarui data portofolio Anda' : 'Catat instrumen investasi untuk memantau pertumbuhan kekayaan'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1.5">
                                <Label>Nama Investasi</Label>
                                <Input
                                    required
                                    value={form.name}
                                    onChange={e => setFormField('name', e.target.value)}
                                    placeholder="Contoh: BBCA, Reksa Dana Syariah, Bitcoin"
                                />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label>Jenis Investasi</Label>
                                <Select value={form.type} onValueChange={v => setFormField('type', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {INVESTMENT_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Modal Awal (Rp)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">Rp</span>
                                    <Input
                                        required
                                        className="pl-9"
                                        value={formatNumber(form.amount)}
                                        onChange={e => setFormField('amount', e.target.value.replace(/\D/g, ''))}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Nilai Saat Ini (Rp) <span className="text-muted-foreground font-normal">– Opsional</span></Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">Rp</span>
                                    <Input
                                        className="pl-9"
                                        value={formatNumber(form.currentValue)}
                                        onChange={e => setFormField('currentValue', e.target.value.replace(/\D/g, ''))}
                                        placeholder="Biarkan kosong jika sama dengan modal"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Tanggal Mulai</Label>
                                <Input
                                    required
                                    type="date"
                                    value={form.startDate}
                                    onChange={e => setFormField('startDate', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Return (%) <span className="text-muted-foreground font-normal">– Opsional</span></Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={form.returns}
                                        onChange={e => setFormField('returns', e.target.value)}
                                        placeholder="Contoh: 12.5"
                                    />
                                    <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">%</span>
                                </div>
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label>Catatan <span className="text-muted-foreground font-normal">– Opsional</span></Label>
                                <Input
                                    value={form.notes}
                                    onChange={e => setFormField('notes', e.target.value)}
                                    placeholder="Contoh: Beli di harga 9.200, target 12.000"
                                />
                            </div>
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
                            >
                                {isSubmitting ? 'Menyimpan...' : editingInvestment ? 'Simpan Perubahan' : 'Tambah Investasi'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}