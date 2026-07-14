'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { User, Mail, Save, Lock, Wallet, Shield, Settings2, CreditCard } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export default function SettingsPage() {
    const { user, updateUser } = useAuthStore()
    const { toast } = useToast()
    
    const [activeTab, setActiveTab] = useState<'profile' | 'finance' | 'security'>('profile')
    const [isLoading, setIsLoading] = useState(false)

    // Profile State
    const [name, setName] = useState(user?.name || '')
    const [email, setEmail] = useState(user?.email || '')

    // Finance State
    const [monthlyIncome, setMonthlyIncome] = useState(user?.monthlyIncome?.toString() || '0')
    const [currency, setCurrency] = useState(user?.currency || 'IDR')

    // Security State
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')

    // Keep state synced if user context updates slowly
    useEffect(() => {
        if (user) {
            setName(user.name || '')
            setEmail(user.email || '')
            setMonthlyIncome(user.monthlyIncome?.toString() || '0')
            setCurrency(user.currency || 'IDR')
        }
    }, [user])

    const handleSave = async () => {
        if (!user?.id) return
        
        setIsLoading(true)
        try {
            const payload: any = { id: user.id }
            
            if (activeTab === 'profile') {
                payload.name = name
                payload.email = email
            } else if (activeTab === 'finance') {
                payload.monthlyIncome = parseFloat(monthlyIncome)
                payload.currency = currency
            } else if (activeTab === 'security') {
                if (!currentPassword || !newPassword) {
                    throw new Error('Harap isi password lama dan baru')
                }
                payload.currentPassword = currentPassword
                payload.newPassword = newPassword
            }

            const response = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Gagal menyimpan pengaturan')
            }

            // Update local store with updated user data
            updateUser({
                name: data.user.name,
                email: data.user.email,
                monthlyIncome: data.user.monthlyIncome,
                currency: data.user.currency,
            })

            toast({
                title: 'Sukses',
                description: 'Pengaturan berhasil disimpan',
            })

            // Clear passwords field on success
            if (activeTab === 'security') {
                setCurrentPassword('')
                setNewPassword('')
            }
        } catch (error: any) {
            toast({
                title: 'Gagal',
                description: error.message || 'Terjadi kesalahan sistem',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Pengaturan Akun</h1>
                <p className="text-muted-foreground mt-1">Kelola profil, preferensi keuangan, dan keamanan akun Anda</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                <Card className="lg:w-64 h-fit border-none shadow-none bg-transparent">
                    <CardContent className="p-0">
                        <nav className="flex flex-col space-y-1">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                    activeTab === 'profile' 
                                    ? 'bg-primary/10 text-primary font-medium' 
                                    : 'hover:bg-muted text-muted-foreground'
                                }`}
                            >
                                <User className="h-5 w-5" />
                                <span>Profil Pengguna</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('finance')}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                    activeTab === 'finance' 
                                    ? 'bg-primary/10 text-primary font-medium' 
                                    : 'hover:bg-muted text-muted-foreground'
                                }`}
                            >
                                <Wallet className="h-5 w-5" />
                                <span>Preferensi Keuangan</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                    activeTab === 'security' 
                                    ? 'bg-primary/10 text-primary font-medium' 
                                    : 'hover:bg-muted text-muted-foreground'
                                }`}
                            >
                                <Shield className="h-5 w-5" />
                                <span>Keamanan</span>
                            </button>
                        </nav>
                    </CardContent>
                </Card>

                {/* Main Content Area */}
                <div className="flex-1">
                    {/* Profile Settings */}
                    {activeTab === 'profile' && (
                        <Card className="border-muted shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    Profil Pribadi
                                </CardTitle>
                                <CardDescription>Perbarui informasi identitas akun Anda</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Nama Lengkap</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="pl-10"
                                            placeholder="Masukkan nama Anda"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            type="email"
                                            className="pl-10"
                                            placeholder="nama@email.com"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <Button onClick={handleSave} disabled={isLoading} className="gap-2">
                                        {isLoading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : <Save className="h-4 w-4" />}
                                        Simpan Profil
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Finance Settings */}
                    {activeTab === 'finance' && (
                        <Card className="border-muted shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Settings2 className="h-5 w-5 text-primary" />
                                    Preferensi Keuangan
                                </CardTitle>
                                <CardDescription>Sesuaikan tampilan dan acuan keuangan Anda</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Mata Uang Utama</label>
                                    <Select value={currency} onValueChange={setCurrency}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Mata Uang" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="IDR">Rupiah (IDR)</SelectItem>
                                            <SelectItem value="USD">US Dollar (USD)</SelectItem>
                                            <SelectItem value="EUR">Euro (EUR)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Target Pemasukan Bulanan</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={monthlyIncome}
                                            onChange={(e) => setMonthlyIncome(e.target.value)}
                                            type="number"
                                            className="pl-10"
                                            placeholder="Contoh: 10000000"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Gunakan angka saja tanpa titik/koma (misal: 15000000)</p>
                                </div>
                                <div className="pt-4">
                                    <Button onClick={handleSave} disabled={isLoading} className="gap-2">
                                        {isLoading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : <Save className="h-4 w-4" />}
                                        Simpan Preferensi
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Security Settings */}
                    {activeTab === 'security' && (
                        <Card className="border-muted shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-primary" />
                                    Keamanan Akun
                                </CardTitle>
                                <CardDescription>Perbarui kata sandi untuk melindungi akun Anda</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Kata Sandi Saat Ini</label>
                                    <Input
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        type="password"
                                        placeholder="Masukkan kata sandi lama Anda"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Kata Sandi Baru</label>
                                    <Input
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        type="password"
                                        placeholder="Ketik kata sandi baru"
                                    />
                                </div>
                                <div className="pt-4">
                                    <Button onClick={handleSave} disabled={isLoading} className="gap-2">
                                        {isLoading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : <Save className="h-4 w-4" />}
                                        Perbarui Kata Sandi
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}