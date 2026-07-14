'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Target, Flame, Star, Flag, Trophy, TrendingUp, Calendar } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface Goal {
    id: string
    name: string
    targetAmount: number
    currentAmount: number
    deadline: string | null
    priority: 'high' | 'medium' | 'low'
    status: string
}

export default function GoalsPage() {
    const { data: session } = useSession()
    const user = session?.user
    const { toast } = useToast()
    
    const [goals, setGoals] = useState<Goal[]>([])
    const [wallets, setWallets] = useState<{ id: string, name: string, balance: number }[]>([])
    const [loading, setLoading] = useState(true)
    
    // Add Form State
    const [showAddForm, setShowAddForm] = useState(false)
    const [formName, setFormName] = useState('')
    const [formTarget, setFormTarget] = useState('')
    const [formDeadline, setFormDeadline] = useState('')
    const [formPriority, setFormPriority] = useState<'high'|'medium'|'low'>('medium')
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    // Top Up Form State
    const [topUpGoal, setTopUpGoal] = useState<Goal | null>(null)
    const [topUpAmount, setTopUpAmount] = useState('')
    const [topUpWalletId, setTopUpWalletId] = useState('')
    const [isToppingUp, setIsToppingUp] = useState(false)

    const fetchGoals = useCallback(async () => {
        if (!user?.id) return
        try {
            setLoading(true)
            const response = await fetch(`/api/goals?userId=${user.id}`)
            const data = await response.json()
            if (response.ok) {
                setGoals(data.goals || [])
            }
        } catch (error) {
            console.error('Error fetching goals:', error)
            toast({
                title: "Error",
                description: "Gagal memuat daftar goal.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }, [user, toast])

    const fetchWallets = useCallback(async () => {
        if (!user?.id) return
        try {
            const response = await fetch(`/api/wallets?userId=${user.id}`)
            if (response.ok) {
                const data = await response.json()
                setWallets(data.wallets)
            }
        } catch (error) {
            console.error('Error fetching wallets:', error)
        }
    }, [user])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchGoals()
            fetchWallets()
        }, 0)
        return () => clearTimeout(timer)
    }, [fetchGoals, fetchWallets])

    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number)
    }

    const handleCreateGoal = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.id) return
        
        setIsSubmitting(true)
        try {
            const response = await fetch('/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    name: formName,
                    targetAmount: parseFloat(formTarget),
                    deadline: formDeadline ? new Date(formDeadline).toISOString() : null,
                    priority: formPriority
                })
            })
            
            if (response.ok) {
                toast({
                    title: "Sukses",
                    description: "Goal berhasil ditambahkan!",
                })
                setShowAddForm(false)
                setFormName('')
                setFormTarget('')
                setFormDeadline('')
                setFormPriority('medium')
                fetchGoals()
            } else {
                throw new Error("Gagal")
            }
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "Gagal menambahkan goal.",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleTopUp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!topUpGoal) return
        
        setIsToppingUp(true)
        try {
            const newAmount = topUpGoal.currentAmount + parseFloat(topUpAmount)
            
            const response = await fetch(`/api/goals/${topUpGoal.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: topUpGoal.name,
                    targetAmount: topUpGoal.targetAmount,
                    deadline: topUpGoal.deadline,
                    priority: topUpGoal.priority,
                    currentAmount: newAmount,
                    status: topUpGoal.status,
                    walletId: topUpWalletId || undefined
                })
            })
            
            if (response.ok) {
                toast({
                    title: "Top-Up Berhasil! 🎉",
                    description: `Berhasil menambahkan ${formatRupiah(parseFloat(topUpAmount))} ke ${topUpGoal.name}.`,
                })
                setTopUpGoal(null)
                setTopUpAmount('')
                setTopUpWalletId('')
                fetchGoals()
                fetchWallets()
            } else {
                throw new Error("Gagal")
            }
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "Gagal top-up goal.",
                variant: "destructive"
            })
        } finally {
            setIsToppingUp(false)
        }
    }

    const getPriorityDetails = (priority: string) => {
        switch (priority) {
            case 'high': return { icon: Flame, color: 'text-red-500', bg: 'bg-red-100', label: 'Tinggi' }
            case 'medium': return { icon: Star, color: 'text-amber-500', bg: 'bg-amber-100', label: 'Sedang' }
            case 'low': return { icon: Flag, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Rendah' }
            default: return { icon: Target, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Biasa' }
        }
    }

    const getMotivationText = (percentage: number) => {
        if (percentage >= 100) return "Target Tercapai! Luar Biasa! 🎉"
        if (percentage >= 70) return "Sedikit lagi! Kamu pasti bisa."
        if (percentage >= 30) return "Setengah jalan menuju mimpimu!"
        return "Awal yang bagus! Terus semangat menabung."
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header Section with Animation */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div>
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Financial Goals
                    </h1>
                    <p className="text-gray-500 mt-1">Wujudkan impian finansialmu satu per satu.</p>
                </div>
                <Button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
                >
                    <Plus className="h-4 w-4 mr-2" /> Buat Goal Baru
                </Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 rounded-xl bg-gray-200 animate-pulse" />
                    ))}
                </div>
            ) : goals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <Target className="h-12 w-12 text-indigo-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Belum ada Goal</h2>
                    <p className="text-gray-500 max-w-md mb-8">
                        Mulai langkah pertamamu! Buat target tabungan untuk dana darurat, liburan, atau gadget baru.
                    </p>
                    <Button onClick={() => setShowAddForm(true)} size="lg">
                        Buat Target Pertamamu
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map((goal, index) => {
                        const percentage = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100)
                        const isCompleted = percentage >= 100
                        const PriorityIcon = getPriorityDetails(goal.priority).icon
                        const priorityInfo = getPriorityDetails(goal.priority)
                        
                        return (
                            <Card 
                                key={goal.id} 
                                className={cn(
                                    "relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group",
                                    isCompleted ? "border-amber-300 shadow-amber-100/50" : "border-gray-200"
                                )}
                                style={{
                                    animation: `slideIn 0.5s ease-out forwards`,
                                    animationDelay: `${index * 150}ms`,
                                    opacity: 0,
                                    transform: 'translateY(20px)'
                                }}
                            >
                                {/* Glowing effect for completed goals */}
                                {isCompleted && (
                                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-100/30 to-yellow-50/10 pointer-events-none" />
                                )}

                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={cn("p-2 rounded-lg", priorityInfo.bg)}>
                                            {isCompleted ? (
                                                <Trophy className="h-5 w-5 text-amber-500" />
                                            ) : (
                                                <PriorityIcon className={cn("h-5 w-5", priorityInfo.color)} />
                                            )}
                                        </div>
                                        <span className={cn(
                                            "text-xs font-medium px-2.5 py-1 rounded-full",
                                            isCompleted ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                                        )}>
                                            {isCompleted ? 'Selesai' : `Prioritas ${priorityInfo.label}`}
                                        </span>
                                    </div>
                                    <CardTitle className="text-xl font-bold leading-tight">
                                        {goal.name}
                                    </CardTitle>
                                </CardHeader>
                                
                                <CardContent className="pb-4">
                                    <div className="mt-4">
                                        <div className="flex justify-between items-end mb-2">
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">Terkumpul</p>
                                                <p className="font-bold text-lg text-gray-900">
                                                    {formatRupiah(goal.currentAmount)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-indigo-600">{percentage}%</p>
                                            </div>
                                        </div>
                                        
                                        <Progress 
                                            value={percentage} 
                                            className="h-3 shadow-inner"
                                            indicatorClassName={cn(
                                                "transition-all duration-1000 ease-out",
                                                isCompleted 
                                                    ? "bg-gradient-to-r from-amber-400 to-yellow-500" 
                                                    : "bg-gradient-to-r from-indigo-500 to-purple-500"
                                            )} 
                                        />
                                        
                                        <div className="flex justify-between items-center mt-3">
                                            <p className="text-xs text-gray-500 flex items-center">
                                                <Target className="h-3 w-3 mr-1" />
                                                Target: {formatRupiah(goal.targetAmount)}
                                            </p>
                                            {goal.deadline && (
                                                <p className="text-xs text-gray-500 flex items-center">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {new Date(goal.deadline).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                                
                                <CardFooter className={cn(
                                    "pt-4 border-t flex flex-col gap-3",
                                    isCompleted ? "bg-amber-50/50" : "bg-gray-50"
                                )}>
                                    <p className={cn(
                                        "text-sm font-medium text-center w-full transition-colors",
                                        isCompleted ? "text-amber-600" : "text-gray-600"
                                    )}>
                                        {getMotivationText(percentage)}
                                    </p>
                                    
                                    {!isCompleted && (
                                        <Button 
                                            variant="outline" 
                                            className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300"
                                            onClick={() => setTopUpGoal(goal)}
                                        >
                                            <TrendingUp className="h-4 w-4 mr-2" /> Top-Up Saldo
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Custom Keyframes for staggered animations */}
            <style jsx global>{`
                @keyframes slideIn {
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>

            {/* Add Goal Dialog */}
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Buat Goal Baru</DialogTitle>
                        <DialogDescription>
                            Tentukan impian finansialmu dan mulai menabung dari sekarang.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateGoal} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nama Impian/Goal</label>
                            <input
                                required
                                type="text"
                                value={formName}
                                onChange={e => setFormName(e.target.value)}
                                placeholder="Cth: Beli Laptop Baru, Liburan ke Bali"
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Target Nominal (Rp)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">Rp</span>
                                <input
                                    required
                                    type="text"
                                    value={formTarget ? Number(formTarget).toLocaleString('id-ID') : ''}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/\D/g, '')
                                        setFormTarget(rawValue)
                                    }}
                                    placeholder="0"
                                    className="w-full pl-9 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Tenggat Waktu (Opsional)</label>
                            <input
                                type="date"
                                value={formDeadline}
                                onChange={e => setFormDeadline(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Prioritas</label>
                            <select
                                value={formPriority}
                                onChange={e => setFormPriority(e.target.value as 'high'|'medium'|'low')}
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            >
                                <option value="high">Tinggi 🔥</option>
                                <option value="medium">Sedang ⭐</option>
                                <option value="low">Rendah 🏁</option>
                            </select>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>Batal</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Goal'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Top-Up Dialog */}
            <Dialog open={!!topUpGoal} onOpenChange={(open) => !open && setTopUpGoal(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Top-Up Goal</DialogTitle>
                        <DialogDescription>
                            Tambahkan tabunganmu untuk mencapai <strong>{topUpGoal?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleTopUp} className="space-y-4 mt-4">
                        <div className="bg-indigo-50 p-4 rounded-lg flex items-center justify-between mb-4">
                            <div className="text-sm text-indigo-900">
                                <p>Sisa Target:</p>
                                <p className="font-bold">
                                    {topUpGoal ? formatRupiah(topUpGoal.targetAmount - topUpGoal.currentAmount) : 'Rp 0'}
                                </p>
                            </div>
                            <Target className="h-8 w-8 text-indigo-300" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nominal Disetor (Rp)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground font-medium text-lg">Rp</span>
                                <input
                                    required
                                    type="text"
                                    value={topUpAmount ? Number(topUpAmount).toLocaleString('id-ID') : ''}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/\D/g, '')
                                        setTopUpAmount(rawValue)
                                    }}
                                    placeholder="0"
                                    className="w-full pl-10 pr-3 py-2 text-lg font-semibold border-2 border-indigo-100 rounded-md focus:border-indigo-500 focus:ring-0 outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Sumber Dana</label>
                            <select
                                required
                                value={topUpWalletId}
                                onChange={e => setTopUpWalletId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            >
                                <option value="" disabled>Pilih dompet pencairan...</option>
                                {wallets.map(w => (
                                    <option key={w.id} value={w.id}>
                                        {w.name} (Saldo: {formatRupiah(w.balance)})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <DialogFooter className="mt-6 pt-4 border-t">
                            <Button type="button" variant="ghost" onClick={() => setTopUpGoal(null)}>Batal</Button>
                            <Button type="submit" disabled={isToppingUp} className="bg-gradient-to-r from-indigo-600 to-purple-600">
                                {isToppingUp ? 'Memproses...' : 'Setor Sekarang'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}