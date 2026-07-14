'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Wallet as WalletIcon, CreditCard, Banknote, Plus, Trash2, Edit2, ArrowRightLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'

interface Wallet {
    id: string
    name: string
    type: 'bank' | 'ewallet' | 'cash'
    balance: number
}

export default function WalletsPage() {
    const { data: session } = useSession()
    const user = session?.user
    const { toast } = useToast()
    const [wallets, setWallets] = useState<Wallet[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        type: 'bank',
        balance: 0,
    })
    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
    const [transferData, setTransferData] = useState({
        fromWalletId: '',
        toWalletId: '',
        amount: 0,
        description: 'Transfer Dana',
    })
    const [isTransferring, setIsTransferring] = useState(false)

    const fetchWallets = useCallback(async () => {
        if (!user) return
        try {
            const res = await fetch(`/api/wallets?userId=${user.id}`)
            if (res.ok) {
                const data = await res.json()
                setWallets(data.wallets)
            }
        } catch (error) {
            console.error('Failed to fetch wallets:', error)
        } finally {
            setIsLoading(false)
        }
    }, [user])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchWallets()
        }, 0)
        return () => clearTimeout(timer)
    }, [fetchWallets])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        try {
            const url = editingWallet 
                ? `/api/wallets/${editingWallet.id}`
                : '/api/wallets'
            const method = editingWallet ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    userId: user.id
                }),
            })

            if (!res.ok) throw new Error('Gagal menyimpan dompet')

            toast({
                title: 'Berhasil',
                description: editingWallet ? 'Dompet berhasil diupdate' : 'Dompet berhasil ditambahkan',
            })

            setIsDialogOpen(false)
            setEditingWallet(null)
            setFormData({ name: '', type: 'bank', balance: 0 })
            fetchWallets()
        } catch (error) {
            console.error(error)
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Gagal menyimpan dompet',
            })
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
                    userId: user.id,
                    type: 'transfer',
                    amount: transferData.amount,
                    walletId: transferData.fromWalletId,
                    toWalletId: transferData.toWalletId,
                    description: transferData.description,
                    date: new Date().toISOString(),
                    isRecurring: false,
                }),
            })

            if (!res.ok) throw new Error('Gagal melakukan transfer')

            toast({ title: 'Berhasil', description: 'Transfer dana berhasil dicatat' })
            setIsTransferDialogOpen(false)
            setTransferData({ fromWalletId: '', toWalletId: '', amount: 0, description: 'Transfer Dana' })
            fetchWallets()
        } catch (error) {
            console.error(error)
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal melakukan transfer' })
        } finally {
            setIsTransferring(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus dompet ini? Transaksi yang terkait akan kehilangan referensi dompet.')) return

        try {
            const res = await fetch(`/api/wallets/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Gagal menghapus dompet')

            toast({
                title: 'Berhasil',
                description: 'Dompet berhasil dihapus',
            })
            fetchWallets()
        } catch (error) {
            console.error(error)
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Gagal menghapus dompet',
            })
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'bank': return <CreditCard className="h-6 w-6 text-blue-500" />
            case 'ewallet': return <WalletIcon className="h-6 w-6 text-purple-500" />
            case 'cash': return <Banknote className="h-6 w-6 text-green-500" />
            default: return <WalletIcon className="h-6 w-6 text-gray-500" />
        }
    }

    const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dompet Saya</h1>
                    <p className="text-muted-foreground mt-1">
                        Kelola berbagai sumber dana Anda (Bank, E-Wallet, Tunai).
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" onClick={() => {
                                setTransferData({ fromWalletId: '', toWalletId: '', amount: 0, description: 'Transfer Dana' })
                            }}>
                                <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Dana
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Transfer Antar Dompet</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleTransfer} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Dari Dompet</Label>
                                    <Select
                                        value={transferData.fromWalletId}
                                        onValueChange={(value) => setTransferData({ ...transferData, fromWalletId: value })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Pilih dompet asal" /></SelectTrigger>
                                        <SelectContent>
                                            {wallets.map(w => (
                                                <SelectItem key={w.id} value={w.id}>{w.name} ({formatCurrency(w.balance)})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Ke Dompet</Label>
                                    <Select
                                        value={transferData.toWalletId}
                                        onValueChange={(value) => setTransferData({ ...transferData, toWalletId: value })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Pilih dompet tujuan" /></SelectTrigger>
                                        <SelectContent>
                                            {wallets.map(w => (
                                                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Jumlah Transfer</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">Rp</span>
                                        <Input
                                            type="text"
                                            value={transferData.amount ? transferData.amount.toLocaleString('id-ID') : ''}
                                            onChange={(e) => {
                                                const rawValue = e.target.value.replace(/\D/g, '')
                                                const numericValue = rawValue ? parseInt(rawValue, 10) : 0
                                                setTransferData({ ...transferData, amount: numericValue })
                                            }}
                                            className="pl-9"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Catatan</Label>
                                    <Input
                                        value={transferData.description}
                                        onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isTransferring}>
                                    {isTransferring ? 'Memproses...' : 'Kirim Dana'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => {
                                setEditingWallet(null)
                                setFormData({ name: '', type: 'bank', balance: 0 })
                            }}>
                                <Plus className="mr-2 h-4 w-4" /> Tambah Dompet
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingWallet ? 'Edit Dompet' : 'Tambah Dompet Baru'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Dompet (Misal: BCA, Gopay)</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Jenis</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih jenis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bank">Bank / Rekening</SelectItem>
                                        <SelectItem value="ewallet">E-Wallet (Ovo, Dana, dll)</SelectItem>
                                        <SelectItem value="cash">Uang Tunai</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {!editingWallet && (
                                <div className="space-y-2">
                                    <Label htmlFor="balance">Saldo Awal</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">Rp</span>
                                        <Input
                                            id="balance"
                                            type="text"
                                            value={formData.balance ? formData.balance.toLocaleString('id-ID') : ''}
                                            onChange={(e) => {
                                                const rawValue = e.target.value.replace(/\D/g, '')
                                                const numericValue = rawValue ? parseInt(rawValue, 10) : 0
                                                setFormData({ ...formData, balance: numericValue })
                                            }}
                                            className="pl-9"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Catatan: Saldo dompet akan otomatis menyesuaikan saat Anda mencatat transaksi.
                                    </p>
                                </div>
                            )}
                            <Button type="submit" className="w-full">
                                {editingWallet ? 'Simpan Perubahan' : 'Simpan'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
                </div>
            </div>

            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
                <CardHeader>
                    <CardTitle className="text-lg">Total Saldo Seluruh Dompet</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold tracking-tight text-primary">
                        {formatCurrency(totalBalance)}
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="h-24 bg-muted/50 rounded-t-lg" />
                        </Card>
                    ))}
                </div>
            ) : wallets.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-12 text-center">
                    <WalletIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <CardTitle>Belum ada dompet</CardTitle>
                    <CardDescription className="max-w-md mt-2">
                        Anda belum menambahkan sumber dana apa pun. Tambahkan dompet pertama Anda untuk mulai mencatat keuangan yang lebih akurat.
                    </CardDescription>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {wallets.map((wallet) => (
                        <Card key={wallet.id} className="overflow-hidden transition-all hover:shadow-md border-muted">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/30">
                                <div className="flex items-center gap-2">
                                    {getIcon(wallet.type)}
                                    <CardTitle className="text-lg">{wallet.name}</CardTitle>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                        onClick={() => {
                                            setEditingWallet(wallet)
                                            setFormData({
                                                name: wallet.name,
                                                type: wallet.type,
                                                balance: 0 // Balance not editable
                                            })
                                            setIsDialogOpen(true)
                                        }}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDelete(wallet.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="text-2xl font-bold">
                                    {formatCurrency(wallet.balance)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 capitalize">
                                    {wallet.type === 'bank' ? 'Rekening Bank' : wallet.type === 'ewallet' ? 'E-Wallet' : 'Tunai'}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
