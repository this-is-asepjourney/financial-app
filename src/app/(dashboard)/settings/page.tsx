'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { User, Mail, Save } from 'lucide-react'

export default function SettingsPage() {
    const { user, updateUser } = useAuthStore()
    const { toast } = useToast()
    const [name, setName] = useState(user?.name || '')
    const [email, setEmail] = useState(user?.email || '')

    const handleSave = () => {
        updateUser({ name, email })
        toast({
            title: 'Sukses',
            description: 'Profil berhasil diupdate',
        })
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold">Pengaturan</h1>
                <p className="text-muted-foreground">Kelola profil dan preferensi Anda</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">
                            <User className="h-4 w-4 inline mr-2" />
                            Nama
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">
                            <Mail className="h-4 w-4 inline mr-2" />
                            Email
                        </label>
                        <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                        />
                    </div>
                    <Button onClick={handleSave} className="gap-2">
                        <Save className="h-4 w-4" />
                        Simpan Perubahan
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}