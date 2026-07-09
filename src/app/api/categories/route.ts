import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const type = searchParams.get('type')

        if (!userId) {
            return NextResponse.json({ error: 'User ID diperlukan' }, { status: 400 })
        }

        const where: any = { userId }
        if (type) where.type = type

        const categories = await prisma.category.findMany({
            where,
            include: {
                _count: {
                    select: { transactions: true },
                },
            },
            orderBy: { name: 'asc' },
        })

        return NextResponse.json({ categories })
    } catch (error) {
        return NextResponse.json(
            { error: 'Gagal mengambil kategori' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { userId, name, type, icon, color, budget } = body

        if (!name || !type) {
            return NextResponse.json(
                { error: 'Nama dan tipe kategori harus diisi' },
                { status: 400 }
            )
        }

        const category = await prisma.category.create({
            data: {
                userId,
                name,
                type,
                icon: icon || 'folder',
                color: color || '#6366F1',
                budget: budget || null,
            },
        })

        return NextResponse.json({ category }, { status: 201 })
    } catch (error) {
        return NextResponse.json(
            { error: 'Gagal membuat kategori' },
            { status: 500 }
        )
    }
}