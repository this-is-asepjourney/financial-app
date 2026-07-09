import { NextResponse } from 'next/server'
import { createUser } from '@/lib/auth'
import { registerSchema } from '@/lib/validation'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const validation = registerSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validasi gagal', details: validation.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const { name, email, password } = validation.data

        const user = await createUser(name, email, password)

        return NextResponse.json({ user }, { status: 201 })
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Email sudah terdaftar' },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Terjadi kesalahan server' },
            { status: 500 }
        )
    }
}