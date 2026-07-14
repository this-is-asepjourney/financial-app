import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { walletSchema } from '@/lib/validation'

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
        
        // Allow partial updates for balance only, or full update for editing wallet
        if (body.balance !== undefined && !body.name) {
            // Partial update for balance syncing
            const wallet = await prisma.wallet.update({
                where: { id },
                data: { balance: body.balance }
            })
            return NextResponse.json({ wallet })
        }

        const validation = walletSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validasi gagal', details: validation.error.issues },
                { status: 400 }
            )
        }

        const { name, type, balance } = validation.data
        const wallet = await prisma.wallet.update({
            where: { id },
            data: { name, type, balance },
        })

        return NextResponse.json({ wallet })
    } catch (error) {
        console.error('Error updating wallet:', error)
        return NextResponse.json(
            { error: 'Gagal mengupdate dompet' },
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
        await prisma.wallet.delete({
            where: { id },
        })
        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Error deleting wallet:', err)
        return NextResponse.json(
            { error: 'Gagal menghapus dompet' },
            { status: 500 }
        )
    }
}
