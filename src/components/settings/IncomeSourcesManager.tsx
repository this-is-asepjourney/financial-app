'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Briefcase, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'

interface IncomeSource {
    id: string
    name: string
    amount: number
    frequency: string
    type: string
}

export function IncomeSourcesManager({ onTotalUpdate }: { onTotalUpdate: (total: number) => void }) {
    const { toast } = useToast()
    const [sources, setSources] = useState<IncomeSource[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)

    // Form state
    const [name, setName] = useState('')
    const [amount, setAmount] = useState('')
    const [frequency, setFrequency] = useState('monthly')
    const [type, setType] = useState('active')

    useEffect(() => {
        fetchSources()
    }, [])

    const fetchSources = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/user/income-sources')
            if (res.ok) {
                const data = await res.json()
                setSources(data)
                calculateTotal(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const calculateTotal = (data: IncomeSource[]) => {
        let total = 0
        data.forEach(source => {
            if (source.frequency === 'daily') total += source.amount * 30
            else if (source.frequency === 'weekly') total += source.amount * 4
            else if (source.frequency === 'monthly') total += source.amount
            else if (source.frequency === 'yearly') total += source.amount / 12
            else if (source.frequency === 'irregular') total += source.amount / 12
        })
        onTotalUpdate(total)
    }

    const handleAdd = async () => {
        if (!name || !amount) {
            toast({ title: 'Gagal', description: 'Nama dan Nominal harus diisi', variant: 'destructive' })
            return
        }

        try {
            const res = await fetch('/api/user/income-sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, amount, frequency, type })
            })

            if (!res.ok) throw new Error('Gagal menambahkan sumber pemasukan')

            toast({ title: 'Sukses', description: 'Sumber pemasukan berhasil ditambahkan' })
            setName('')
            setAmount('')
            setIsAdding(false)
            fetchSources()
        } catch (error) {
            toast({ title: 'Gagal', description: 'Gagal menambah sumber pemasukan', variant: 'destructive' })
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/user/income-sources/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Gagal menghapus')
            toast({ title: 'Sukses', description: 'Berhasil dihapus' })
            fetchSources()
        } catch (error) {
            toast({ title: 'Gagal', description: 'Gagal menghapus', variant: 'destructive' })
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-indigo-500" />
                    Manajer Sumber Pemasukan
                </h3>
                <Button variant="outline" size="sm" onClick={() => setIsAdding(!isAdding)}>
                    {isAdding ? 'Batal' : <><Plus className="h-4 w-4 mr-1" /> Tambah</>}
                </Button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg flex gap-3 text-sm text-blue-800 dark:text-blue-300">
                <Info className="h-5 w-5 shrink-0 mt-0.5" />
                <p>Pendapatan bulanan Anda akan dihitung secara otomatis berdasarkan akumulasi dari semua sumber pemasukan di bawah ini.</p>
            </div>

            {isAdding && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Nama Pekerjaan/Sumber</label>
                            <Input placeholder="Contoh: Gaji Utama, Freelance" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Nominal (Rp)</label>
                            <Input type="number" placeholder="1000000" value={amount} onChange={(e) => setAmount(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Frekuensi</label>
                            <Select value={frequency} onValueChange={setFrequency}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Harian</SelectItem>
                                    <SelectItem value="weekly">Mingguan</SelectItem>
                                    <SelectItem value="monthly">Bulanan</SelectItem>
                                    <SelectItem value="yearly">Tahunan</SelectItem>
                                    <SelectItem value="irregular">Tidak Tetap (Asumsi per tahun)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Tipe Pemasukan</label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Aktif (Bekerja)</SelectItem>
                                    <SelectItem value="passive">Pasif (Investasi/Aset)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button onClick={handleAdd} className="w-full">Simpan Pemasukan</Button>
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-4 text-sm text-muted-foreground">Memuat data...</div>
            ) : sources.length === 0 ? (
                <div className="text-center border border-dashed rounded-lg py-8 text-slate-500 dark:text-slate-400">
                    Belum ada sumber pemasukan yang ditambahkan.
                </div>
            ) : (
                <div className="space-y-2">
                    {sources.map(source => (
                        <div key={source.id} className="flex justify-between items-center p-3 border rounded-lg bg-white dark:bg-slate-950">
                            <div>
                                <h4 className="font-medium text-sm">{source.name}</h4>
                                <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                    <span className="capitalize">{source.frequency}</span>
                                    <span>•</span>
                                    <span className="capitalize">{source.type}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-sm">Rp{source.amount.toLocaleString('id-ID')}</span>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(source.id)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
