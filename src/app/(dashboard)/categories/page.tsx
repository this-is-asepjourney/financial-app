'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
    Edit,
    Trash2,
    Folder,
    RefreshCw,
    Coffee,
    ShoppingBag,
    Car,
    Home,
    Briefcase,
    Gift,
    Heart,
    Utensils,
    Smartphone,
    Zap,
    Music,
    Book,
    Plane,
    Monitor,
    Smile,
    Shield
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Category {
    id: string
    name: string
    type: 'income' | 'expense'
    color: string
    icon: string | null
    currentMonthTotal?: number
    _count?: {
        transactions: number
    }
}

// Map string icon names to Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
    folder: Folder,
    coffee: Coffee,
    shopping: ShoppingBag,
    car: Car,
    home: Home,
    briefcase: Briefcase,
    gift: Gift,
    heart: Heart,
    utensils: Utensils,
    smartphone: Smartphone,
    zap: Zap,
    music: Music,
    book: Book,
    plane: Plane,
    monitor: Monitor,
    smile: Smile,
    shield: Shield
}

const PRESET_COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', 
    '#10B981', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', 
    '#8B5CF6', '#A855F7', '#D946EF', '#F43F5E', '#64748B', '#000000'
]

export default function CategoriesPage() {
    const user = useAuthStore((state) => state.user)
    const { toast } = useToast()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')

    // Form state
    const [formName, setFormName] = useState('')
    const [formType, setFormType] = useState<'income' | 'expense'>('expense')
    const [formColor, setFormColor] = useState('#6366F1')
    const [formIcon, setFormIcon] = useState('folder')

    const fetchCategories = useCallback(async () => {
        try {
            const response = await fetch(`/api/categories?userId=${user?.id}`)
            const data = await response.json()
            if (response.ok) {
                setCategories(data.categories)
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
            toast({
                title: 'Error',
                description: 'Gagal memuat kategori',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }, [user, toast])

    useEffect(() => {
        if (user?.id) {
            const timer = setTimeout(() => {
                fetchCategories()
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [user, fetchCategories])

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetchCategories()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formName) {
            toast({
                title: 'Error',
                description: 'Nama kategori harus diisi',
                variant: 'destructive',
            })
            return
        }

        try {
            const url = editingCategory
                ? `/api/categories/${editingCategory.id}`
                : '/api/categories'
            const method = editingCategory ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    name: formName,
                    type: formType,
                    color: formColor,
                    icon: formIcon
                }),
            })

            if (response.ok) {
                toast({
                    title: 'Sukses',
                    description: editingCategory
                        ? 'Kategori berhasil diupdate'
                        : 'Kategori berhasil ditambahkan',
                })
                resetForm()
                handleRefresh()
            } else {
                const error = await response.json()
                throw new Error(error.error)
            }
        } catch (error: unknown) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Gagal menyimpan kategori',
                variant: 'destructive',
            })
        }
    }

    const handleEdit = (category: Category) => {
        setEditingCategory(category)
        setFormName(category.name)
        setFormType(category.type)
        setFormColor(category.color)
        setFormIcon(category.icon || 'folder')
        setShowForm(true)
    }

    const handleDelete = async (id: string, categoryName: string, transactionCount: number = 0) => {
        if (transactionCount > 0) {
            toast({
                title: 'Error',
                description: `Tidak dapat menghapus kategori yang masih digunakan oleh ${transactionCount} transaksi`,
                variant: 'destructive',
            })
            return
        }

        if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${categoryName}"?`)) return

        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                toast({
                    title: 'Sukses',
                    description: 'Kategori berhasil dihapus',
                })
                handleRefresh()
            } else {
                const error = await response.json()
                throw new Error(error.error)
            }
        } catch (error: unknown) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Gagal menghapus kategori',
                variant: 'destructive',
            })
        }
    }

    const resetForm = () => {
        setFormName('')
        setFormType('expense')
        setFormColor('#6366F1')
        setFormIcon('folder')
        setEditingCategory(null)
        setShowForm(false)
    }

    const filteredCategories = categories.filter(c => filterType === 'all' || c.type === filterType)
    const expenseCategoriesCount = categories.filter(c => c.type === 'expense').length
    const incomeCategoriesCount = categories.filter(c => c.type === 'income').length

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kategori Transaksi</h1>
                    <p className="text-muted-foreground mt-1">
                        Kelola dan klasifikasikan arus kas Anda dengan mudah
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
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh Data</span>
                    </Button>
                    <Dialog open={showForm} onOpenChange={(open) => {
                        setShowForm(open)
                        if (!open) resetForm()
                    }}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Tambah Kategori
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[450px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Nama Kategori</label>
                                    <Input
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        placeholder="Contoh: Makanan, Gaji, Transportasi"
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1 block">Tipe</label>
                                    <Select
                                        value={formType}
                                        onValueChange={(val: 'income' | 'expense') => setFormType(val)}
                                        disabled={!!editingCategory}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih tipe" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="expense">Pengeluaran</SelectItem>
                                            <SelectItem value="income">Pemasukan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1 block">Pilih Ikon</label>
                                    <div className="grid grid-cols-6 gap-2 bg-muted/30 p-2 rounded-md">
                                        {Object.keys(ICON_MAP).map((iconKey) => {
                                            const IconComponent = ICON_MAP[iconKey]
                                            return (
                                                <button
                                                    key={iconKey}
                                                    type="button"
                                                    onClick={() => setFormIcon(iconKey)}
                                                    className={`p-2 rounded-md flex items-center justify-center transition-all ${
                                                        formIcon === iconKey 
                                                        ? 'bg-primary text-primary-foreground shadow-sm' 
                                                        : 'hover:bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    <IconComponent className="h-5 w-5" />
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1 block">Pilih Warna</label>
                                    <div className="grid grid-cols-8 gap-2 mb-2">
                                        {PRESET_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setFormColor(color)}
                                                className={`w-8 h-8 rounded-full transition-transform ${
                                                    formColor === color ? 'scale-110 ring-2 ring-offset-2 ring-primary' : 'hover:scale-105'
                                                }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex space-x-2 pt-4">
                                    <Button type="submit" className="flex-1">
                                        {editingCategory ? 'Update Kategori' : 'Simpan Kategori'}
                                    </Button>
                                    {editingCategory && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={resetForm}
                                        >
                                            Batal
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Summary Cards */}
            {!loading && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-500/10 via-background to-background border-blue-500/20 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-600">Total Kategori</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-500/10 via-background to-background border-red-500/20 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-red-600">Kategori Pengeluaran</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{expenseCategoriesCount}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-500/10 via-background to-background border-green-500/20 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-600">Kategori Pemasukan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{incomeCategoriesCount}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 border-b pb-4 overflow-x-auto">
                <Button 
                    variant={filterType === 'all' ? 'default' : 'outline'} 
                    onClick={() => setFilterType('all')}
                    size="sm"
                    className="rounded-full px-5"
                >
                    Semua ({categories.length})
                </Button>
                <Button 
                    variant={filterType === 'expense' ? 'default' : 'outline'} 
                    onClick={() => setFilterType('expense')}
                    size="sm"
                    className="rounded-full px-5"
                >
                    Pengeluaran ({expenseCategoriesCount})
                </Button>
                <Button 
                    variant={filterType === 'income' ? 'default' : 'outline'} 
                    onClick={() => setFilterType('income')}
                    size="sm"
                    className="rounded-full px-5"
                >
                    Pemasukan ({incomeCategoriesCount})
                </Button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="col-span-full text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl bg-gray-50/50">
                        <Folder className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-xl font-medium text-gray-600">Tidak ada kategori ditemukan</p>
                        <p className="text-sm mt-1">Klik Tambah Kategori untuk membuat kategori baru.</p>
                    </div>
                ) : (
                    filteredCategories.map((category) => {
                        const IconComponent = category.icon && ICON_MAP[category.icon] ? ICON_MAP[category.icon] : Folder
                        const typeColor = category.type === 'income' ? 'text-green-600' : 'text-red-600'
                        
                        return (
                            <Card key={category.id} className="group hover:shadow-md hover:border-primary/50 transition-all duration-300 overflow-hidden relative">
                                {/* Top color strip */}
                                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: category.color }} />
                                
                                <CardContent className="p-5 pt-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center space-x-4 w-full overflow-hidden">
                                            <div
                                                className="w-12 h-12 rounded-xl flex shrink-0 items-center justify-center transition-transform group-hover:scale-105"
                                                style={{ backgroundColor: category.color + '20' }}
                                            >
                                                <IconComponent className="h-6 w-6" style={{ color: category.color }} />
                                            </div>
                                            <div className="overflow-hidden flex-1">
                                                <h3 className="font-semibold text-lg truncate" title={category.name}>{category.name}</h3>
                                                <p className="text-xs text-muted-foreground capitalize flex items-center gap-1.5 mt-1">
                                                    <span className={`w-2 h-2 rounded-full ${category.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    {category.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                                onClick={() => handleEdit(category)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-red-100 text-red-500 hover:text-red-700"
                                                onClick={() => handleDelete(category.id, category.name, category._count?.transactions)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-5 pt-4 border-t border-gray-100">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Total Bulan Ini</p>
                                                <p className={`font-bold text-lg ${typeColor}`}>
                                                    {formatCurrency(category.currentMonthTotal || 0)}
                                                </p>
                                            </div>
                                            <div className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">
                                                {category._count?.transactions || 0} Trx
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    )
}