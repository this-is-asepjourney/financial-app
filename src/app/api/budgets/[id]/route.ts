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
        const userId = session.user.id

        const { id } = await params
        const body = await request.json()
        const { amount, dueDate, isRecurring } = body

        const budget = await prisma.budget.update({
            where: { id },
            data: { 
                amount,
                dueDate: dueDate ? new Date(dueDate) : null,
                isRecurring: isRecurring !== undefined ? isRecurring : undefined
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
                        color: true,
                    },
                },
            },
        })

        return NextResponse.json({ budget })
    } catch {
        return NextResponse.json(
            { error: 'Gagal mengupdate budget' },
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
        const userId = session.user.id

        const { id } = await params
        await prisma.budget.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json(
            { error: 'Gagal menghapus budget' },
            { status: 500 }
        )
    }
}