'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
    TrendingUp,
    TrendingDown
} from 'lucide-react'

interface Category {
    id: string
    name: string
    type: 'income' | 'expense'
    color: string
    icon: string | null
    _count?: {
        transactions: number
    }
}

export default function CategoriesPage() {
    const user = useAuthStore((state) => state.user)
    const { toast } = useToast()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')

    // Form state
    const [formName, setFormName] = useState('')
    const [formType, setFormType] = useState<'income' | 'expense'>('expense')
    const [formColor, setFormColor] = useState('#6366F1')

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true)
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
                    icon: 'folder'
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
                fetchCategories()
            } else {
                const error = await response.json()
                throw new Error(error.error)
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Gagal menyimpan kategori',
                variant: 'destructive',
            })
        }
    }

    const handleEdit = (category: Category) => {
        setEditingCategory(category)
        setFormName(category.name)
        setFormType(category.type)
        setFormColor(category.color)
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
                fetchCategories()
            } else {
                const error = await response.json()
                throw new Error(error.error)
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Gagal menghapus kategori',
                variant: 'destructive',
            })
        }
    }

    const resetForm = () => {
        setFormName('')
        setFormType('expense')
        setFormColor('#6366F1')
        setEditingCategory(null)
        setShowForm(false)
    }

    const filteredCategories = categories.filter(c => filterType === 'all' || c.type === filterType)

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Kategori</h1>
                    <p className="text-muted-foreground">
                        Kelola kategori pemasukan dan pengeluaran Anda
                    </p>
                </div>
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
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">
                                    Nama Kategori
                                </label>
                                <Input
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="Contoh: Gaji, Makanan, Transportasi"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">
                                    Tipe
                                </label>
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
                                <label className="text-sm font-medium mb-1 block">
                                    Warna Kategori
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={formColor}
                                        onChange={(e) => setFormColor(e.target.value)}
                                        className="w-16 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        type="text"
                                        value={formColor}
                                        onChange={(e) => setFormColor(e.target.value)}
                                        placeholder="#000000"
                                        className="flex-1 uppercase font-mono"
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-2 pt-2">
                                <Button type="submit" className="flex-1">
                                    {editingCategory ? 'Update' : 'Simpan'}
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

            {/* Filters */}
            <div className="flex gap-2 border-b pb-4 overflow-x-auto">
                <Button 
                    variant={filterType === 'all' ? 'default' : 'outline'} 
                    onClick={() => setFilterType('all')}
                    size="sm"
                >
                    Semua
                </Button>
                <Button 
                    variant={filterType === 'expense' ? 'default' : 'outline'} 
                    onClick={() => setFilterType('expense')}
                    size="sm"
                >
                    Pengeluaran
                </Button>
                <Button 
                    variant={filterType === 'income' ? 'default' : 'outline'} 
                    onClick={() => setFilterType('income')}
                    size="sm"
                >
                    Pemasukan
                </Button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground border rounded-lg bg-gray-50/50">
                        <Folder className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">Tidak ada kategori</p>
                        <p className="text-sm">Klik Tambah Kategori untuk membuat kategori baru.</p>
                    </div>
                ) : (
                    filteredCategories.map((category) => (
                        <Card key={category.id}>
                            <CardContent className="p-4 sm:p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center space-x-3 w-full overflow-hidden">
                                        <div
                                            className="w-10 h-10 rounded-full flex shrink-0 items-center justify-center"
                                            style={{ backgroundColor: category.color + '20' }}
                                        >
                                            {category.type === 'income' ? (
                                                <TrendingUp className="h-5 w-5" style={{ color: category.color }} />
                                            ) : (
                                                <TrendingDown className="h-5 w-5" style={{ color: category.color }} />
                                            )}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h3 className="font-semibold text-base truncate" title={category.name}>{category.name}</h3>
                                            <p className="text-xs text-muted-foreground capitalize flex items-center gap-1 mt-0.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${category.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                {category.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 -mr-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleEdit(category)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(category.id, category.name, category._count?.transactions)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t text-xs text-muted-foreground flex justify-between items-center">
                                    <span>Digunakan oleh:</span>
                                    <span className="font-medium bg-gray-100 px-2 py-1 rounded-md">{category._count?.transactions || 0} Trx</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}