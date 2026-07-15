'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { transactionSchema, TransactionInput } from '@/lib/validation'
import { useToast } from '@/components/ui/use-toast'

interface Category {
    id: string
    name: string
    type: string
    icon: string | null
    color: string
}

interface Wallet {
    id: string
    name: string
    type: string
}

interface TransactionFormProps {
    userId: string
    categories: Category[]
    wallets?: Wallet[]
    transaction?: {
        id: string
        amount: number
        type: 'income' | 'expense' | 'transfer'
        description: string | null
        date: string
        categoryId: string | null
        isRecurring: boolean
        recurringType: string | null
    } | null
    onSuccess: () => void
}

export function TransactionForm({
    userId,
    categories,
    wallets = [],
    transaction,
    onSuccess,
}: TransactionFormProps) {
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [transactionType, setTransactionType] = useState<'income' | 'expense'>(
        (transaction?.type === 'income' || transaction?.type === 'expense') ? transaction.type : 'expense'
    )
    const [displayAmount, setDisplayAmount] = useState<string>(
        transaction?.amount ? transaction.amount.toLocaleString('id-ID') : ''
    )

    const filteredCategories = categories.filter(
        (cat) => cat.type === transactionType
    )

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<TransactionInput>({
        resolver: zodResolver(transactionSchema) as any,
        defaultValues: {
            amount: transaction?.amount || 0,
            type: (transaction?.type === 'income' || transaction?.type === 'expense') ? transaction.type : 'expense',
            categoryId: transaction?.categoryId || undefined,
            walletId: (transaction as any)?.walletId || undefined,
            description: transaction?.description || '',
            date: transaction ? new Date(transaction.date) : new Date(),
            isRecurring: transaction?.isRecurring ?? false,
            recurringType: (transaction?.recurringType as 'daily' | 'weekly' | 'monthly' | 'yearly' | undefined) ?? undefined,
        },
    })

    const isRecurring = watch('isRecurring')

    const onSubmit = async (data: TransactionInput) => {
        try {
            setIsSubmitting(true)
            const url = transaction
                ? `/api/transactions/${transaction.id}`
                : '/api/transactions'
            const method = transaction ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, userId }),
            })

            if (response.ok) {
                toast({
                    title: 'Sukses',
                    description: transaction
                        ? 'Transaksi berhasil diupdate'
                        : 'Transaksi berhasil ditambahkan',
                })
                onSuccess()
            } else {
                const error = await response.json()
                throw new Error(error.error)
            }
        } catch (error: unknown) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Gagal menyimpan transaksi',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatForDatetimeLocal = (date: Date | string | number | undefined | null) => {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Type Selector */}
            <div className="flex space-x-4">
                <Button
                    type="button"
                    variant={transactionType === 'expense' ? 'default' : 'outline'}
                    className={`flex-1 ${transactionType === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    onClick={() => {
                        setTransactionType('expense')
                        setValue('type', 'expense')
                        setValue('categoryId', undefined)
                    }}
                >
                    Pengeluaran
                </Button>
                <Button
                    type="button"
                    variant={transactionType === 'income' ? 'default' : 'outline'}
                    className={`flex-1 ${transactionType === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    onClick={() => {
                        setTransactionType('income')
                        setValue('type', 'income')
                        setValue('categoryId', undefined)
                    }}
                >
                    Pemasukan
                </Button>
            </div>

            {/* Amount */}
            <div>
                <label className="text-sm font-medium mb-1 block">Jumlah</label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">Rp</span>
                    <Input
                        type="text"
                        value={displayAmount}
                        onChange={(e) => {
                            const rawValue = e.target.value.replace(/\D/g, '')
                            const numericValue = rawValue ? parseInt(rawValue, 10) : 0
                            
                            setDisplayAmount(numericValue ? numericValue.toLocaleString('id-ID') : '')
                            setValue('amount', numericValue, { shouldValidate: true })
                        }}
                        placeholder="0"
                        className="text-lg pl-9"
                    />
                </div>
                {errors.amount && (
                    <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
                )}
            </div>

            {/* Wallet */}
            <div>
                <label className="text-sm font-medium mb-1 block">Dompet (Sumber Dana)</label>
                <Select
                    onValueChange={(value) => setValue('walletId', value === 'none' ? undefined : value)}
                    defaultValue={(transaction as any)?.walletId || undefined}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih dompet (Opsional)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Tanpa Dompet / Global</SelectItem>
                        {wallets.map((wallet) => (
                            <SelectItem key={wallet.id} value={wallet.id}>
                                {wallet.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Category */}
            <div>
                <label className="text-sm font-medium mb-1 block">Kategori</label>
                <Select
                    onValueChange={(value) => setValue('categoryId', value)}
                    defaultValue={transaction?.categoryId || undefined}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                        {filteredCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center space-x-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: category.color }}
                                    />
                                    <span>{category.name}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.categoryId && (
                    <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>
                )}
            </div>

            {/* Description */}
            <div>
                <label className="text-sm font-medium mb-1 block">Deskripsi</label>
                <Input
                    {...register('description')}
                    placeholder="Deskripsi transaksi"
                />
            </div>

            {/* Date */}
            <div>
                <label className="text-sm font-medium mb-1 block">Tanggal & Waktu</label>
                <Input
                    type="datetime-local"
                    value={formatForDatetimeLocal(watch('date'))}
                    onChange={(e) => setValue('date', new Date(e.target.value), { shouldValidate: true })}
                />
                {errors.date && (
                    <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>
                )}
            </div>

            {/* Recurring */}
            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    {...register('isRecurring')}
                    className="rounded border-gray-300"
                    id="isRecurring"
                />
                <label htmlFor="isRecurring" className="text-sm">
                    Transaksi berulang
                </label>
            </div>

            {isRecurring && (
                <div>
                    <label className="text-sm font-medium mb-1 block">
                        Frekuensi Pengulangan
                    </label>
                    <Select
                        onValueChange={(value) => setValue('recurringType', value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                        defaultValue={transaction?.recurringType || undefined}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih frekuensi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Harian</SelectItem>
                            <SelectItem value="weekly">Mingguan</SelectItem>
                            <SelectItem value="monthly">Bulanan</SelectItem>
                            <SelectItem value="yearly">Tahunan</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting
                    ? 'Menyimpan...'
                    : transaction
                        ? 'Update Transaksi'
                        : 'Tambah Transaksi'}
            </Button>
        </form>
    )
}