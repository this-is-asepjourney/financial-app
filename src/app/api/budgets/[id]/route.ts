import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
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