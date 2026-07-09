import { NextResponse } from 'next/server'
import { verifyUser } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const validation = loginSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validasi gagal', details: validation.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const { email, password } = validation.data
        const user = await verifyUser(email, password)

        if (!user) {
            return NextResponse.json(
                { error: 'Email atau password salah' },
                { status: 401 }
            )
        }

        // In production, implement JWT or session management here
        return NextResponse.json({ user, token: 'jwt-token-will-be-here' })
    } catch {
        return NextResponse.json(
            { error: 'Terjadi kesalahan server' },
            { status: 500 }
        )
    }
}