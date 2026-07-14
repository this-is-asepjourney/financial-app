'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    TrendingUp,
    TrendingDown,
    ArrowUpDown,
    Download,
    ChevronLeft,
    ChevronRight,
    ArrowRightLeft,
    Wallet,
    Calendar,
} from 'lucide-react'
import { TransactionForm } from '@/components/forms/TransactionForm'
import { useToast } from '@/components/ui/use-toast'

interface Transaction {
    id: string
    amount: number
    type: 'income' | 'expense' | 'transfer'
    description: string | null
    date: string
    categoryId: string | null
    category: {
        id: string
        name: string
        icon: string | null
        color: string
    } | null
    wallet: {
        id: string
        name: string
        type: string
    } | null
    toWalletId?: string | null
    toWallet?: {
        id: string
        name: string
        type: string
    } | null
    isRecurring: boolean
    recurringType: string | null
}

interface Category {
    id: string
    name: string
    type: string
    icon: string | null
    color: string
}

export default function TransactionsPage() {
    const user = useAuthStore((state) => state.user)
    const { toast } = useToast()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [wallets, setWallets] = useState<{ id: string, name: string, type: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState<string>('all')
    const [filterCategory, setFilterCategory] = useState<string>('all')
    const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7))

    // Pagination
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const limit = 20

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                userId: user?.id || '',
                page: page.toString(),
                limit: limit.toString(),
            })

            if (searchTerm) params.append('search', searchTerm)
            if (filterType !== 'all') params.append('type', filterType)
            if (filterCategory !== 'all') params.append('categoryId', filterCategory)
            if (filterMonth) params.append('month', filterMonth)

            const response = await fetch(`/api/transactions?${params}`)
            const data = await response.json()

            setTransactions(data.transactions)
            setTotalPages(data.pagination.totalPages)
        } catch (error) {
            console.error('Error fetching transactions:', error)
            toast({
                title: 'Error',
                description: 'Gagal memuat transaksi',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }, [user, page, searchTerm, filterType, filterCategory, filterMonth, toast])

    const fetchCategories = useCallback(async () => {
        try {
            const response = await fetch(`/api/categories?userId=${user?.id}`)
            const data = await response.json()
            setCategories(data.categories)
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }, [user])

    const fetchWallets = useCallback(async () => {
        try {
            const response = await fetch(`/api/wallets?userId=${user?.id}`)
            if (response.ok) {
                const data = await response.json()
                setWallets(data.wallets)
            }
        } catch (error) {
            console.error('Error fetching wallets:', error)
        }
    }, [user])

    useEffect(() => {
        if (user?.id) {
            const timer = setTimeout(() => {
                fetchTransactions()
                fetchCategories()
                fetchWallets()
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [user, fetchTransactions, fetchCategories, fetchWallets])

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return

        try {
            const response = await fetch(`/api/transactions/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                toast({
                    title: 'Sukses',
                    description: 'Transaksi berhasil dihapus',
                })
                fetchTransactions()
            } else {
                throw new Error('Gagal menghapus')
            }
        } catch {
            toast({
                title: 'Error',
                description: 'Gagal menghapus transaksi',
                variant: 'destructive',
            })
        }
    }

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction)
        setShowForm(true)
    }

    const handleFormSuccess = () => {
        setShowForm(false)
        setEditingTransaction(null)
        fetchTransactions()
    }

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Transaksi</h1>
                    <p className="text-muted-foreground">Kelola pemasukan dan pengeluaran Anda</p>
                </div>
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Tambah Transaksi
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
                            </DialogTitle>
                        </DialogHeader>
                        <TransactionForm
                            userId={user?.id || ''}
                            categories={categories}
                            wallets={wallets}
                            transaction={editingTransaction}
                            onSuccess={handleFormSuccess}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Pemasukan</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(totalIncome)}
                                </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {formatCurrency(totalExpense)}
                                </p>
                            </div>
                            <TrendingDown className="h-8 w-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Saldo</p>
                                <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    {formatCurrency(totalIncome - totalExpense)}
                                </p>
                            </div>
                            <ArrowUpDown className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari transaksi..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger>
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Tipe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tipe</SelectItem>
                                <SelectItem value="income">Pemasukan</SelectItem>
                                <SelectItem value="expense">Pengeluaran</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kategori</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            type="month"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Transactions List */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Daftar Transaksi</CardTitle>
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Belum ada transaksi
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/20 border rounded-lg hover:bg-muted/40 transition-colors gap-4 sm:gap-0"
                                >
                                    <div className="flex items-center space-x-4 w-full sm:w-auto">
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: transaction.category?.color ? transaction.category.color + '20' : 'rgba(0,0,0,0.05)' }}
                                        >
                                            {transaction.type === 'income' ? (
                                                <TrendingUp className="h-6 w-6 text-green-600" />
                                            ) : transaction.type === 'expense' ? (
                                                <TrendingDown className="h-6 w-6 text-red-600" />
                                            ) : (
                                                <ArrowRightLeft className="h-6 w-6 text-purple-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-base">
                                                {transaction.description || (transaction.type === 'transfer' ? 'Transfer Dana' : 'Transaksi')}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {formatDate(transaction.date)}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    {transaction.type === 'transfer' ? (
                                                        <ArrowRightLeft className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: transaction.category?.color || '#cbd5e1' }} />
                                                    )}
                                                    {transaction.type === 'transfer' 
                                                        ? 'Transfer'
                                                        : (transaction.category?.name || 'Tanpa Kategori')}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Wallet className="h-3.5 w-3.5" />
                                                    {transaction.type === 'transfer' 
                                                        ? `${transaction.wallet?.name || '?'} → ${transaction.toWallet?.name || '?'}`
                                                        : (transaction.wallet?.name || 'Tanpa Dompet')}
                                                </span>
                                                {transaction.isRecurring && (
                                                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium border border-blue-200">
                                                        Recurring
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between w-full sm:w-auto space-x-4">
                                        <span className={`font-semibold ${
                                            transaction.type === 'income' ? 'text-green-600' : 
                                            transaction.type === 'expense' ? 'text-red-600' : 'text-purple-600'
                                            }`}>
                                            {transaction.type === 'income' ? '+' : 
                                             transaction.type === 'expense' ? '-' : ''}
                                            {formatCurrency(transaction.amount)}
                                        </span>
                                        <div className="flex space-x-2">
                                            {transaction.type !== 'transfer' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(transaction)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(transaction.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-6 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                Halaman {page} dari {totalPages}
                            </p>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}