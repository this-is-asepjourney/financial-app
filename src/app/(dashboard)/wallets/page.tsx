'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Wallet as WalletIcon, CreditCard, Banknote, Plus, Trash2, Edit2, ArrowRightLeft,
    Shield, PiggyBank, TrendingUp, RefreshCw, Building2, Briefcase, Info,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'

interface Wallet {
    id: string
    name: string
    type: 'bank' | 'ewallet' | 'cash'
    purpose: 'darurat' | 'tabungan' | 'operasional' | 'investasi' | 'bisnis'
    balance: number
    projectedBalance?: number
}

// ─── Config: Purpose ────────────────────────────────────────────────────────
const PURPOSE_CONFIG = {
    darurat: {
        label: 'Dana Darurat',
        shortLabel: 'Darurat',
        description: 'Disimpan untuk keadaan darurat (PHK, sakit, dll)',
        icon: Shield,
        color: 'text-blue-600',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        border: 'border-blue-300 dark:border-blue-700',
        gradient: 'from-blue-500 to-indigo-600',
        badge: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    tabungan: {
        label: 'Tabungan',
        shortLabel: 'Tabungan',
        description: 'Tabungan untuk tujuan tertentu (liburan, DP rumah, dll)',
        icon: PiggyBank,
        color: 'text-green-600',
        bg: 'bg-green-100 dark:bg-green-900/30',
        border: 'border-green-300 dark:border-green-700',
        gradient: 'from-green-500 to-emerald-600',
        badge: 'bg-green-100 text-green-700 border-green-200',
    },
    operasional: {
        label: 'Operasional',
        shortLabel: 'Operasional',
        description: 'Dana untuk kebutuhan dan pengeluaran sehari-hari',
        icon: WalletIcon,
        color: 'text-orange-600',
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        border: 'border-orange-300 dark:border-orange-700',
        gradient: 'from-orange-500 to-amber-500',
        badge: 'bg-orange-100 text-orange-700 border-orange-200',
    },
    investasi: {
        label: 'Investasi',
        shortLabel: 'Investasi',
        description: 'Dana cair untuk keperluan investasi aktif',
        icon: TrendingUp,
        color: 'text-teal-600',
        bg: 'bg-teal-100 dark:bg-teal-900/30',
        border: 'border-teal-300 dark:border-teal-700',
        gradient: 'from-teal-500 to-cyan-600',
        badge: 'bg-teal-100 text-teal-700 border-teal-200',
    },
    bisnis: {
        label: 'Bisnis / Usaha',
        shortLabel: 'Bisnis',
        description: 'Dana khusus untuk keperluan bisnis/usaha',
        icon: Briefcase,
        color: 'text-purple-600',
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        border: 'border-purple-300 dark:border-purple-700',
        gradient: 'from-purple-500 to-violet-600',
        badge: 'bg-purple-100 text-purple-700 border-purple-200',
    },
} as const

// ─── Config: Wallet Type ─────────────────────────────────────────────────────
const TYPE_CONFIG = {
    bank: { label: 'Rekening Bank', icon: CreditCard },
    ewallet: { label: 'E-Wallet (OVO, Dana, dll)', icon: WalletIcon },
    cash: { label: 'Uang Tunai', icon: Banknote },
}

const EMPTY_FORM = { name: '', type: 'bank', purpose: 'operasional', balance: 0 }
const PURPOSE_ORDER: Array<keyof typeof PURPOSE_CONFIG> = ['darurat', 'tabungan', 'operasional', 'investasi', 'bisnis']

export default function WalletsPage() {
    const { data: session } = useSession()
    const user = session?.user
    const { toast } = useToast()

    const [wallets, setWallets] = useState<Wallet[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [formData, setFormData] = useState(EMPTY_FORM)
    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
    const [transferData, setTransferData] = useState({ fromWalletId: '', toWalletId: '', amount: 0, description: 'Transfer Dana' })
    const [isTransferring, setIsTransferring] = useState(false)

    // avg monthly expenses from API — for emergency fund target calc
    const [avgExpenses, setAvgExpenses] = useState(0)

    const fetchWallets = useCallback(async () => {
        if (!user) return
        try {
            const [wRes, hRes] = await Promise.all([
                fetch(`/api/wallets?userId=${user.id}`),
                fetch(`/api/financial-health?userId=${user.id}`),
            ])
            if (wRes.ok) {
                const data = await wRes.json()
                setWallets(data.wallets || [])
            }
            if (hRes.ok) {
                const hData = await hRes.json()
                setAvgExpenses(hData.financialData?.avgMonthlyExpenses || hData.financialData?.monthlyExpenses || 0)
            }
        } catch (error) {
            console.error('Failed to fetch wallets:', error)
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [user])

    useEffect(() => {
        const timer = setTimeout(() => fetchWallets(), 0)
        return () => clearTimeout(timer)
    }, [fetchWallets])

    const handleRefresh = () => { setIsRefreshing(true); fetchWallets() }

    const openAddDialog = () => {
        setEditingWallet(null)
        setFormData(EMPTY_FORM)
        setIsDialogOpen(true)
    }

    const openEditDialog = (wallet: Wallet) => {
        setEditingWallet(wallet)
        setFormData({ name: wallet.name, type: wallet.type, purpose: wallet.purpose, balance: wallet.balance })
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        try {
            const url = editingWallet ? `/api/wallets/${editingWallet.id}` : '/api/wallets'
            const method = editingWallet ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, userId: user.id }),
            })
            if (!res.ok) throw new Error()
            toast({ title: 'Berhasil', description: editingWallet ? 'Dompet diperbarui' : 'Dompet ditambahkan' })
            setIsDialogOpen(false)
            setEditingWallet(null)
            fetchWallets()
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyimpan dompet' })
        }
    }

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        if (transferData.fromWalletId === transferData.toWalletId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Dompet asal dan tujuan tidak boleh sama' })
            return
        }
        if (transferData.amount <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Jumlah transfer harus lebih dari 0' })
            return
        }
        setIsTransferring(true)
        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id, type: 'transfer',
                    amount: transferData.amount,
                    walletId: transferData.fromWalletId,
                    toWalletId: transferData.toWalletId,
                    description: transferData.description,
                    date: new Date().toISOString(),
                    isRecurring: false,
                }),
            })
            if (!res.ok) throw new Error()
            toast({ title: 'Berhasil', description: 'Transfer dana berhasil dicatat' })
            setIsTransferDialogOpen(false)
            setTransferData({ fromWalletId: '', toWalletId: '', amount: 0, description: 'Transfer Dana' })
            fetchWallets()
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal melakukan transfer' })
        } finally {
            setIsTransferring(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus dompet ini? Transaksi terkait akan kehilangan referensi.')) return
        try {
            const res = await fetch(`/api/wallets/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error()
            toast({ title: 'Berhasil', description: 'Dompet dihapus' })
            fetchWallets()
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus dompet' })
        }
    }

    const formatAmount = (raw: number) => raw ? raw.toLocaleString('id-ID') : ''
    const parseAmount = (str: string) => parseInt(str.replace(/\D/g, '') || '0', 10)

    // Derived stats
    const totalBalance = wallets.reduce((s, w) => s + w.balance, 0)
    const emergencyFundBalance = wallets.filter(w => w.purpose === 'darurat').reduce((s, w) => s + w.balance, 0)
    const tabunganBalance = wallets.filter(w => w.purpose === 'tabungan').reduce((s, w) => s + w.balance, 0)
    const operasionalBalance = wallets.filter(w => w.purpose === 'operasional').reduce((s, w) => s + w.balance, 0)

    const emergencyTarget3 = avgExpenses * 3
    const emergencyTarget6 = avgExpenses * 6
    const emergencyPct = emergencyTarget6 > 0 ? Math.min((emergencyFundBalance / emergencyTarget6) * 100, 100) : 0
    const emergencyMonths = avgExpenses > 0 ? emergencyFundBalance / avgExpenses : 0

    const groupedWallets = PURPOSE_ORDER.reduce((acc, purpose) => {
        const group = wallets.filter(w => w.purpose === purpose)
        if (group.length > 0) acc[purpose] = group
        return acc
    }, {} as Record<string, Wallet[]>)

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dompet Saya</h1>
                    <p className="text-muted-foreground mt-1">Kelola semua sumber dana berdasarkan tujuan finansial</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing || isLoading} className="gap-2">
                        <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>
                    <Button variant="outline" onClick={() => setIsTransferDialogOpen(true)} className="gap-2">
                        <ArrowRightLeft className="h-4 w-4" /> Transfer Dana
                    </Button>
                    <Button onClick={openAddDialog} className="gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md">
                        <Plus className="h-4 w-4" /> Tambah Dompet
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="lg:col-span-1 bg-gradient-to-br from-primary/10 to-background border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-primary flex items-center gap-1.5">
                            <WalletIcon className="h-4 w-4" /> Total Saldo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{formatCurrency(totalBalance)}</div>
                        <p className="text-xs text-muted-foreground mt-1">{wallets.length} dompet aktif</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-background border-blue-300/40">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-blue-600 flex items-center gap-1.5">
                            <Shield className="h-4 w-4" /> Dana Darurat
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-blue-600">{formatCurrency(emergencyFundBalance)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {emergencyMonths.toFixed(1)} bln dari target 6 bln
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-background border-green-300/40">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-green-600 flex items-center gap-1.5">
                            <PiggyBank className="h-4 w-4" /> Tabungan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-green-600">{formatCurrency(tabunganBalance)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total saldo tabungan</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500/10 to-background border-orange-300/40">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-orange-600 flex items-center gap-1.5">
                            <Building2 className="h-4 w-4" /> Operasional
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-orange-600">{formatCurrency(operasionalBalance)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Dana harian & pengeluaran</p>
                    </CardContent>
                </Card>
            </div>

            {/* Dana Darurat Progress */}
            {avgExpenses > 0 && (
                <Card className={cn('border-2', emergencyPct >= 100 ? 'border-green-400' : emergencyPct >= 50 ? 'border-blue-400' : 'border-red-400')}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-600" />
                            Kecukupan Dana Darurat
                            <span className={cn(
                                'ml-auto text-sm font-bold px-2 py-0.5 rounded-full',
                                emergencyPct >= 100 ? 'bg-green-100 text-green-700' :
                                emergencyPct >= 50 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                            )}>
                                {emergencyMonths.toFixed(1)} / 6 bulan
                            </span>
                        </CardTitle>
                        <CardDescription className="flex items-start gap-1.5 text-xs">
                            <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                            Dihitung dari dompet bertujuan &quot;Dana Darurat&quot; ÷ rata-rata pengeluaran 3 bulan terakhir
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Progress
                            value={emergencyPct}
                            className="h-3"
                            indicatorClassName={cn(
                                'transition-all duration-700',
                                emergencyPct >= 100 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                emergencyPct >= 50 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                                'bg-gradient-to-r from-red-400 to-rose-500'
                            )}
                        />
                        <div className="grid grid-cols-3 gap-4 text-xs">
                            <div>
                                <p className="text-muted-foreground">Saldo Dana Darurat</p>
                                <p className="font-bold text-blue-600">{formatCurrency(emergencyFundBalance)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Target Minimum (3 bln)</p>
                                <p className="font-bold">{formatCurrency(emergencyTarget3)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Target Ideal (6 bln)</p>
                                <p className="font-bold">{formatCurrency(emergencyTarget6)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Wallet Groups */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <Card key={i} className="animate-pulse h-36 bg-muted/30" />)}
                </div>
            ) : wallets.length === 0 ? (
                <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <WalletIcon className="h-14 w-14 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Belum ada dompet</h3>
                        <CardDescription className="max-w-md mb-6">
                            Tambahkan dompet pertama Anda dan atur tujuannya agar Financial Health Score menjadi akurat.
                        </CardDescription>
                        <Button onClick={openAddDialog}><Plus className="h-4 w-4 mr-2" />Tambah Dompet</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {PURPOSE_ORDER.map(purpose => {
                        const group = groupedWallets[purpose]
                        if (!group) return null
                        const cfg = PURPOSE_CONFIG[purpose]
                        const PurposeIcon = cfg.icon
                        const groupTotal = group.reduce((s, w) => s + w.balance, 0)

                        return (
                            <div key={purpose}>
                                {/* Group header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', cfg.bg)}>
                                        <PurposeIcon className={cn('h-4 w-4', cfg.color)} />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-base">{cfg.label}</h2>
                                        <p className="text-xs text-muted-foreground">{cfg.description}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className={cn('font-bold text-sm', cfg.color)}>{formatCurrency(groupTotal)}</p>
                                        <p className="text-xs text-muted-foreground">{group.length} dompet</p>
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {group.map((wallet, index) => {
                                        const TypeIcon = TYPE_CONFIG[wallet.type]?.icon || WalletIcon
                                        return (
                                            <Card
                                                key={wallet.id}
                                                className={cn('overflow-hidden hover:shadow-md transition-all group border', cfg.border)}
                                                style={{ animation: `slideUp 0.3s ease-out ${index * 60}ms both` }}
                                            >
                                                <CardContent className="p-0">
                                                    {/* Top gradient strip */}
                                                    <div className={cn('h-1 bg-gradient-to-r', cfg.gradient)} />
                                                    <div className="p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', cfg.bg)}>
                                                                    <TypeIcon className={cn('h-4.5 w-4.5', cfg.color)} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-sm leading-tight">{wallet.name}</p>
                                                                    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full border', cfg.badge)}>
                                                                        {cfg.shortLabel}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    variant="ghost" size="icon"
                                                                    className="h-7 w-7 hover:bg-primary/10"
                                                                    onClick={() => openEditDialog(wallet)}
                                                                >
                                                                    <Edit2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost" size="icon"
                                                                    className="h-7 w-7 hover:bg-red-100 text-red-500"
                                                                    onClick={() => handleDelete(wallet.id)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-1">Saldo Saat Ini</p>
                                                            <p className={cn('text-xl font-bold', cfg.color)}>{formatCurrency(wallet.balance)}</p>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-2 capitalize">
                                                            {TYPE_CONFIG[wallet.type]?.label || wallet.type}
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <style jsx global>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingWallet(null) }}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle>{editingWallet ? 'Edit Dompet' : 'Tambah Dompet Baru'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                        <div className="space-y-1.5">
                            <Label>Nama Dompet</Label>
                            <Input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Contoh: BCA Utama, Dana Darurat BRI, Gopay"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Jenis Media</Label>
                                <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bank">Bank / Rekening</SelectItem>
                                        <SelectItem value="ewallet">E-Wallet</SelectItem>
                                        <SelectItem value="cash">Uang Tunai</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Tujuan Dompet</Label>
                                <Select value={formData.purpose} onValueChange={v => setFormData({ ...formData, purpose: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {PURPOSE_ORDER.map(p => (
                                            <SelectItem key={p} value={p}>{PURPOSE_CONFIG[p].label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Purpose hint */}
                        {formData.purpose && (
                            <div className={cn('flex items-start gap-2 p-3 rounded-lg border text-xs',
                                PURPOSE_CONFIG[formData.purpose as keyof typeof PURPOSE_CONFIG]?.bg,
                                PURPOSE_CONFIG[formData.purpose as keyof typeof PURPOSE_CONFIG]?.border
                            )}>
                                <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                    <span className="font-semibold">
                                        {PURPOSE_CONFIG[formData.purpose as keyof typeof PURPOSE_CONFIG]?.label}:&nbsp;
                                    </span>
                                    {PURPOSE_CONFIG[formData.purpose as keyof typeof PURPOSE_CONFIG]?.description}
                                    {formData.purpose === 'darurat' && ' · Digunakan untuk menghitung kecukupan dana darurat di Financial Health.'}
                                    {formData.purpose === 'tabungan' && ' · Digunakan sebagai komponen tabungan di Financial Health.'}
                                </p>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label>Saldo (Rp)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground font-medium text-sm">Rp</span>
                                <Input
                                    className="pl-9"
                                    value={formData.balance !== undefined ? formatAmount(formData.balance) : ''}
                                    onChange={e => setFormData({ ...formData, balance: parseAmount(e.target.value) })}
                                    placeholder="0"
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {editingWallet 
                                    ? "Edit saldo saat ini secara manual." 
                                    : "Saldo awal (akan otomatis berubah sesuai transaksi)."}
                            </p>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                            <Button type="submit" className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700">
                                {editingWallet ? 'Simpan Perubahan' : 'Tambah Dompet'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Transfer Dialog */}
            <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Transfer Antar Dompet</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleTransfer} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Dari Dompet</Label>
                            <Select value={transferData.fromWalletId} onValueChange={v => setTransferData({ ...transferData, fromWalletId: v })}>
                                <SelectTrigger><SelectValue placeholder="Pilih dompet asal" /></SelectTrigger>
                                <SelectContent>
                                    {wallets.map(w => (
                                        <SelectItem key={w.id} value={w.id}>
                                            {w.name} ({PURPOSE_CONFIG[w.purpose]?.shortLabel}) — {formatCurrency(w.balance)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Ke Dompet</Label>
                            <Select value={transferData.toWalletId} onValueChange={v => setTransferData({ ...transferData, toWalletId: v })}>
                                <SelectTrigger><SelectValue placeholder="Pilih dompet tujuan" /></SelectTrigger>
                                <SelectContent>
                                    {wallets.map(w => (
                                        <SelectItem key={w.id} value={w.id}>
                                            {w.name} ({PURPOSE_CONFIG[w.purpose]?.shortLabel})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Jumlah Transfer</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">Rp</span>
                                <Input
                                    type="text"
                                    value={transferData.amount ? formatAmount(transferData.amount) : ''}
                                    onChange={e => setTransferData({ ...transferData, amount: parseAmount(e.target.value) })}
                                    className="pl-9"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Catatan</Label>
                            <Input
                                value={transferData.description}
                                onChange={e => setTransferData({ ...transferData, description: e.target.value })}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isTransferring}>
                            {isTransferring ? 'Memproses...' : 'Kirim Dana'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
