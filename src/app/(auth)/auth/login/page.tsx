'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { loginSchema, LoginInput } from '@/lib/validation'
import { TrendingUp, Eye, EyeOff } from 'lucide-react'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
    const router = useRouter()
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginInput) => {
        try {
            setError('')
            
            const result = await signIn('credentials', {
                redirect: false,
                email: data.email,
                password: data.password,
            })

            if (result?.error) {
                setError(result.error)
                return
            }

            router.push('/dashboard')
            router.refresh()
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
                    <CardTitle className="text-2xl">Selamat Datang Kembali</CardTitle>
                    <CardDescription>
                        Masuk ke akun Anda untuk melanjutkan
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
                            <label className="text-sm font-medium mb-1 block">Email</label>
                            <Input
                                {...register('email')}
                                type="email"
                                placeholder="nama@email.com"
                                error={errors.email?.message}
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Password</label>
                            <div className="relative">
                                <Input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Masukkan password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-500" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-500" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Memproses...' : 'Masuk'}
                        </Button>

                        <p className="text-center text-sm text-gray-600">
                            Belum punya akun?{' '}
                            <Link href="/auth/register" className="text-indigo-600 hover:underline">
                                Daftar sekarang
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}