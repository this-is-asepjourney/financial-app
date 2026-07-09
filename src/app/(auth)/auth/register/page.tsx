'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { registerSchema, RegisterInput } from '@/lib/validation'
import { TrendingUp } from 'lucide-react'

export default function RegisterPage() {
    const router = useRouter()
    const [error, setError] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
    })

    const onSubmit = async (data: RegisterInput) => {
        try {
            setError('')
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error)
            }

            router.push('/auth/login?registered=true')
        } catch (err: unknown) {
            setError((err as Error).message)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <TrendingUp className="h-12 w-12 text-indigo-600" />
                    </div>
                    <CardTitle className="text-2xl">Buat Akun Baru</CardTitle>
                    <CardDescription>
                        Mulai kelola keuangan Anda dengan lebih baik
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium mb-1 block">Nama Lengkap</label>
                            <Input
                                {...register('name')}
                                type="text"
                                placeholder="John Doe"
                            />
                            {errors.name && (
                                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Email</label>
                            <Input
                                {...register('email')}
                                type="email"
                                placeholder="nama@email.com"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Password</label>
                            <Input
                                {...register('password')}
                                type="password"
                                placeholder="Minimal 6 karakter"
                            />
                            {errors.password && (
                                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Konfirmasi Password</label>
                            <Input
                                {...register('confirmPassword')}
                                type="password"
                                placeholder="Masukkan ulang password"
                            />
                            {errors.confirmPassword && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Mendaftar...' : 'Daftar Sekarang'}
                        </Button>

                        <p className="text-center text-sm text-gray-600">
                            Sudah punya akun?{' '}
                            <Link href="/auth/login" className="text-indigo-600 hover:underline">
                                Masuk di sini
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}