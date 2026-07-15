'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, calculatePercentage } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import {
    Plus,
    Edit,
    Trash2,
    AlertTriangle,
    CheckCircle,
    TrendingDown,
    CalendarClock,
    CreditCard
} from 'lucide-react'

interface Budget {
    id: string
    amount: number
    spent: number
    month: string
    dueDate: string | null
    isRecurring: boolean
    category: {
        id: string
        name: string
        icon: string | null
        color: string
    }
}

interface Category {
    id: string
    name: string
    type: string
    color: string
}

interface UserWallet {
    id: string
    name: string
    balance: number
}

export default function BudgetPage() {
    const { data: session } = useSession()
    const user = session?.user
    const { toast } = useToast()
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [wallets, setWallets] = useState<UserWallet[]>([])
    const [loading, setLoading] = useState(true)
    
    const [showForm, setShowForm] = useState(false)
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
    const [selectedMonth, setSelectedMonth] = useState<string>(
        new Date().toISOString().slice(0, 7)
    )

    // Budget Form state
    const [formCategoryId, setFormCategoryId] = useState('')
    const [formAmount, setFormAmount] = useState('')
    const [formDueDate, setFormDueDate] = useState('')
    const [formIsRecurring, setFormIsRecurring] = useState(false)

    // Pay Bill Form state
    const [showPayForm, setShowPayForm] = useState(false)
    const [payingBudget, setPayingBudget] = useState<Budget | null>(null)
    const [payWalletId, setPayWalletId] = useState<string>('')
    const [payAmount, setPayAmount] = useState<string>('')
    const [isSubmittingPay, setIsSubmittingPay] = useState(false)

    const fetchBudgets = useCallback(async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                userId: user?.id || '',
                month: selectedMonth + '-01',
            })

            const response = await fetch(`/api/budgets?${params}`)
            const data = await response.json()
            setBudgets(data.budgets || [])
        } catch (error) {
            console.error('Error fetching budgets:', error)
            toast({
                title: 'Error',
                description: 'Gagal memuat budget/tagihan',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }, [user, selectedMonth, toast])

    const fetchCategories = useCallback(async () => {
        try {
            const response = await fetch(
                `/api/categories?userId=${user?.id}&type=expense`
            )
            const data = await response.json()
            setCategories(data.categories)
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }, [user])

    const fetchWallets = useCallback(async () => {
        try {
            const response = await fetch(`/api/wallets?userId=${user?.id}`)
            const data = await response.json()
            setWallets(data.wallets || [])
        } catch (error) {
            console.error('Error fetching wallets:', error)
        }
    }, [user])

    useEffect(() => {
        if (user?.id) {
            const timer = setTimeout(() => {
                fetchBudgets()
                fetchCategories()
                fetchWallets()
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [user, fetchBudgets, fetchCategories, fetchWallets])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formCategoryId || !formAmount) {
            toast({
                title: 'Error',
                description: 'Kategori dan Jumlah harus diisi',
                variant: 'destructive',
            })
            return
        }

        try {
            const url = editingBudget
                ? `/api/budgets/${editingBudget.id}`
                : '/api/budgets'
            const method = editingBudget ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    categoryId: formCategoryId,
                    amount: parseFloat(formAmount),
                    month: selectedMonth + '-01',
                    dueDate: formDueDate ? new Date(formDueDate).toISOString() : null,
                    isRecurring: formIsRecurring,
                }),
            })

            if (response.ok) {
                toast({
                    title: 'Sukses',
                    description: editingBudget
                        ? 'Tagihan/Budget berhasil diupdate'
                        : 'Tagihan/Budget berhasil ditambahkan',
                })
                resetForm()
                fetchBudgets()
            } else {
                const error = await response.json()
                throw new Error(error.error)
            }
        } catch (error: unknown) {
            toast({
                title: 'Error',
                description: (error as Error).message || 'Gagal menyimpan budget',
                variant: 'destructive',
            })
        }
    }

    const handlePaySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!payingBudget || !payWalletId || !payAmount) {
            toast({ title: 'Error', description: 'Pilih dompet dan masukkan nominal', variant: 'destructive' })
            return
        }

        try {
            setIsSubmittingPay(true)
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    amount: parseFloat(payAmount),
                    type: 'expense',
                    categoryId: payingBudget.category.id,
                    walletId: payWalletId,
                    description: `Pembayaran Tagihan/Budget: ${payingBudget.category.name}`,
                    date: new Date().toISOString(),
                    isRecurring: false,
                })
            })

            if (response.ok) {
                toast({ title: 'Sukses', description: 'Pembayaran tagihan berhasil dicatat!' })
                setShowPayForm(false)
                setPayingBudget(null)
                fetchBudgets()
                fetchWallets() // Refresh wallet balances
            } else {
                const err = await response.json()
                throw new Error(err.error)
            }
        } catch (error) {
            toast({ title: 'Error', description: (error as Error).message || 'Gagal membayar tagihan', variant: 'destructive' })
        } finally {
            setIsSubmittingPay(false)
        }
    }

    const handleEdit = (budget: Budget) => {
        setEditingBudget(budget)
        setFormCategoryId(budget.category.id)
        setFormAmount(budget.amount.toString())
        setFormDueDate(budget.dueDate ? new Date(budget.dueDate).toISOString().split('T')[0] : '')
        setFormIsRecurring(budget.isRecurring || false)
        setShowForm(true)
    }

    const handlePay = (budget: Budget) => {
        setPayingBudget(budget)
        setPayAmount(Math.max(0, budget.amount - budget.spent).toString())
        setPayWalletId('')
        setShowPayForm(true)
    }

    const handleDelete = async (id: string, categoryName: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus tagihan/budget untuk "${categoryName}"?`)) return

        try {
            const response = await fetch(`/api/budgets/${id}`, { method: 'DELETE' })
            if (response.ok) {
                toast({ title: 'Sukses', description: 'Budget berhasil dihapus' })
                fetchBudgets()
            } else {
                throw new Error('Gagal menghapus budget')
            }
        } catch (error) {
            toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' })
        }
    }

    const resetForm = () => {
        setFormCategoryId('')
        setFormAmount('')
        setFormDueDate('')
        setFormIsRecurring(false)
        setEditingBudget(null)
        setShowForm(false)
    }

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
    const totalPercentage = calculatePercentage(totalSpent, totalBudget)

    const getStatusColor = (spent: number, amount: number) => {
        const percentage = (spent / amount) * 100
        if (percentage >= 100) return 'text-green-600' // If bill is fully paid, it's green (good)
        if (percentage >= 80) return 'text-yellow-600'
        return 'text-blue-600'
    }

    const getProgressColor = (spent: number, amount: number) => {
        const percentage = (spent / amount) * 100
        if (percentage >= 100) return 'bg-green-600'
        if (percentage >= 80) return 'bg-yellow-600'
        return 'bg-blue-600'
    }

    // Separate budgets into active and completed (fully spent/paid)
    const activeBudgets = budgets.filter(b => b.spent < b.amount)
    const completedBudgets = budgets.filter(b => b.spent >= b.amount)

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Tagihan & Budget</h1>
                    <p className="text-muted-foreground">
                        Ngeplot tagihan bulanan dan pantau batas pengeluaran Anda
                    </p>
                </div>
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 shadow-sm">
                            <Plus className="h-4 w-4" />
                            Buat Tagihan/Budget
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingBudget ? 'Edit' : 'Buat Baru'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Kategori</label>
                                <Select value={formCategoryId} onValueChange={setFormCategoryId} disabled={!!editingBudget}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kategori pengeluaran" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                                                    <span>{category.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Nominal Tagihan / Batas Budget</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">Rp</span>
                                    <Input
                                        type="text"
                                        value={formAmount ? Number(formAmount).toLocaleString('id-ID') : ''}
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/\D/g, '')
                                            setFormAmount(rawValue)
                                        }}
                                        placeholder="0"
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Tanggal Jatuh Tempo (Opsional)</label>
                                <Input
                                    type="date"
                                    value={formDueDate}
                                    onChange={(e) => setFormDueDate(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Berfungsi sebagai pengingat tagihan bulanan
                                </p>
                            </div>

                            <div className="flex items-center p-3 border rounded-lg bg-slate-50">
                                <input
                                    type="checkbox"
                                    id="recurring"
                                    checked={formIsRecurring}
                                    onChange={(e) => setFormIsRecurring(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-3"
                                />
                                <label htmlFor="recurring" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Jadikan Pengeluaran Wajib (Bulan Berikutnya Otomatis Dibuat)
                                </label>
                            </div>

                            <div className="flex space-x-2 pt-2">
                                <Button type="submit" className="flex-1">
                                    {editingBudget ? 'Simpan Perubahan' : 'Buat'}
                                </Button>
                                {editingBudget && (
                                    <Button type="button" variant="outline" onClick={resetForm}>
                                        Batal
                                    </Button>
                                )}
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Payment Modal */}
            <Dialog open={showPayForm} onOpenChange={setShowPayForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bayar Tagihan</DialogTitle>
                        <DialogDescription>
                            Selesaikan pembayaran untuk {payingBudget?.category.name}. Transaksi akan otomatis memotong saldo dompet Anda.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePaySubmit} className="space-y-4 mt-2">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Sumber Dana (Dompet)</label>
                            <Select value={payWalletId} onValueChange={setPayWalletId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih dompet sumber dana" />
                                </SelectTrigger>
                                <SelectContent>
                                    {wallets.map((w) => (
                                        <SelectItem key={w.id} value={w.id}>
                                            {w.name} (Saldo: {formatCurrency(w.balance)})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Nominal yang Dibayarkan</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">Rp</span>
                                <Input
                                    type="text"
                                    value={payAmount ? Number(payAmount).toLocaleString('id-ID') : ''}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/\D/g, '')
                                        setPayAmount(rawValue)
                                    }}
                                    className="pl-9 text-lg"
                                />
                            </div>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setShowPayForm(false)}>Batal</Button>
                            <Button type="submit" disabled={isSubmittingPay}>
                                {isSubmittingPay ? 'Memproses...' : 'Konfirmasi Pembayaran'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Month Selector */}
            <div className="flex items-center space-x-4 bg-background p-3 rounded-lg border shadow-sm w-fit">
                <label className="text-sm font-medium text-muted-foreground">Bulan Tagihan:</label>
                <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-48 border-none shadow-none focus-visible:ring-0 px-0 h-auto"
                />
            </div>

            {/* Summary Card */}
            <Card className="border-none shadow-md bg-gradient-to-br from-indigo-500/10 via-background to-background">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Total Tagihan / Budget</p>
                            <p className="text-3xl font-bold">{formatCurrency(totalBudget)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Sudah Dibayar / Terpakai</p>
                            <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalSpent)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Sisa yang Belum Dibayar</p>
                            <p className={`text-3xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                {formatCurrency(Math.max(0, totalBudget - totalSpent))}
                            </p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="flex justify-between text-sm mb-2 font-medium">
                            <span>Progress Keseluruhan</span>
                            <span className={getStatusColor(totalSpent, totalBudget)}>
                                {totalPercentage}%
                            </span>
                        </div>
                        <Progress
                            value={Math.min(totalPercentage, 100)}
                            className={`h-3 ${getProgressColor(totalSpent, totalBudget)}`}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Budget List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : budgets.length === 0 ? (
                <Card className="border-dashed border-2">
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <CalendarClock className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p className="text-xl font-medium mb-1">Belum ada plot tagihan</p>
                        <p className="text-sm">Tambahkan tagihan bulanan (seperti listrik, air, kos) untuk memudahkan pembayaran</p>
                        <Button className="mt-4" onClick={() => setShowForm(true)}>Buat Tagihan Pertama</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    
                    {/* Active/Unpaid Section */}
                    {activeBudgets.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" /> 
                                Belum Lunas / Dalam Proses
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                {activeBudgets.map((budget) => (
                                    <BudgetCard 
                                        key={budget.id} 
                                        budget={budget} 
                                        onEdit={() => handleEdit(budget)}
                                        onDelete={() => handleDelete(budget.id, budget.category.name)}
                                        onPay={() => handlePay(budget)}
                                        isPaid={false}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Paid Section */}
                    {completedBudgets.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-green-700">
                                <CheckCircle className="h-5 w-5" /> 
                                Selesai / Lunas
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4 opacity-70 hover:opacity-100 transition-opacity">
                                {completedBudgets.map((budget) => (
                                    <BudgetCard 
                                        key={budget.id} 
                                        budget={budget} 
                                        onEdit={() => handleEdit(budget)}
                                        onDelete={() => handleDelete(budget.id, budget.category.name)}
                                        isPaid={true}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Helper Component for Budget Card
function BudgetCard({ budget, onEdit, onDelete, onPay, isPaid }: { budget: Budget, onEdit: () => void, onDelete: () => void, onPay?: () => void, isPaid: boolean }) {
    const percentage = calculatePercentage(budget.spent, budget.amount)
    const isOverBudget = budget.spent > budget.amount

    const getDaysLeftText = (dueDateString: string | null, isRecurring: boolean) => {
        if (!dueDateString) return null
        let dueDate = new Date(dueDateString)
        const today = new Date()
        dueDate.setHours(0, 0, 0, 0)
        today.setHours(0, 0, 0, 0)
        
        // Jika rutin dan sudah lewat, hitung untuk jadwal bulan berikutnya
        if (isRecurring && dueDate.getTime() < today.getTime()) {
            dueDate.setMonth(dueDate.getMonth() + 1)
        }

        const diffTime = dueDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays > 0) return `${diffDays} hari lagi`
        if (diffDays === 0) return 'Hari ini'
        return `Terlewat ${Math.abs(diffDays)} hari`
    }

    return (
        <Card className={`overflow-hidden transition-all hover:shadow-md ${isPaid ? 'border-green-200 bg-green-50/30' : 'border-slate-200'}`}>
            {isPaid && (
                <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 text-center flex items-center justify-center gap-1">
                    <CheckCircle className="h-3 w-3" /> LUNAS
                </div>
            )}
            <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4">
                    <div className="flex items-center space-x-4">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: budget.category.color + '20' }}
                        >
                            <TrendingDown
                                className="h-6 w-6"
                                style={{ color: budget.category.color }}
                            />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">
                                {budget.category.name}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1.5">
                                {budget.dueDate && (
                                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        Jatuh Tempo: {new Date(budget.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                        {!isPaid && ` (${getDaysLeftText(budget.dueDate, budget.isRecurring)})`}
                                    </span>
                                )}
                                {budget.isRecurring && (
                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-medium">
                                        Rutin
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex sm:flex-col justify-end gap-1 border-t sm:border-t-0 pt-3 sm:pt-0">
                        <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 text-muted-foreground hover:text-primary">
                            <Edit className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 text-muted-foreground hover:text-red-500">
                            <Trash2 className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Hapus</span>
                        </Button>
                    </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border mb-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-muted-foreground">Target / Tagihan</span>
                        <span className="font-bold text-lg">{formatCurrency(budget.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Dibayar / Terpakai</span>
                        <span className={`font-bold text-lg ${isPaid ? 'text-green-600' : 'text-blue-600'}`}>{formatCurrency(budget.spent)}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                        <span>Progress Pembayaran</span>
                        <span className={isOverBudget ? 'text-red-600' : isPaid ? 'text-green-600' : 'text-blue-600'}>
                            {percentage}%
                        </span>
                    </div>
                    <Progress
                        value={Math.min(percentage, 100)}
                        className={`h-2 ${isOverBudget ? 'bg-red-200 [&>div]:bg-red-600' : isPaid ? 'bg-green-100 [&>div]:bg-green-500' : 'bg-slate-100 [&>div]:bg-blue-500'}`}
                    />
                    
                    {/* Pay Button for Unpaid Bills */}
                    {!isPaid && onPay && (
                        <div className="pt-3">
                            <Button className="w-full gap-2" onClick={onPay}>
                                <CreditCard className="h-4 w-4" /> Bayar Sisa Tagihan
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}