import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
        try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const body = await request.json()
        const { name, type, icon, color, budget, isDebtPayment } = body

        const category = await prisma.category.update({
            where: { id },
            data: {
                name,
                type,
                icon,
                color,
                budget,
                isDebtPayment: isDebtPayment === true,
            },
        })

        return NextResponse.json({ category })
    } catch (_error) {
        return NextResponse.json(
            { error: 'Gagal mengupdate kategori' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
        try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        // Check if category has transactions
        const transactionCount = await prisma.transaction.count({
            where: { categoryId: id },
        })

        if (transactionCount > 0) {
            return NextResponse.json(
                { error: 'Kategori memiliki transaksi. Hapus atau pindahkan transaksi terlebih dahulu.' },
                { status: 400 }
            )
        }

        await prisma.category.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (_error) {
        return NextResponse.json(
            { error: 'Gagal menghapus kategori' },
            { status: 500 }
        )
    }
}