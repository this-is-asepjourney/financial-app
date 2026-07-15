import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id

        const debts = await prisma.debt.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        })

        const summary = {
            totalRemainingAmount: debts.reduce((s, d) => s + d.remainingAmount, 0),
            totalMonthlyPayment: debts.reduce((s, d) => s + d.monthlyPayment, 0),
            totalOriginalAmount: debts.reduce((s, d) => s + d.totalAmount, 0),
            count: debts.length,
        }

        return NextResponse.json({ debts, summary })
    } catch (error) {
        console.error('Error fetching debts:', error)
        return NextResponse.json({ error: 'Gagal mengambil data utang' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id

        const body = await request.json()
        const { name, type, totalAmount, remainingAmount, monthlyPayment, interestRate, dueDate } = body

        if (!name || !type || !totalAmount || !remainingAmount || !monthlyPayment) {
            return NextResponse.json(
                { error: 'Nama, tipe, jumlah total, sisa utang, dan cicilan bulanan harus diisi' },
                { status: 400 }
            )
        }

        const debt = await prisma.debt.create({
            data: {
                userId,
                name,
                type,
                totalAmount: parseFloat(totalAmount),
                remainingAmount: parseFloat(remainingAmount),
                monthlyPayment: parseFloat(monthlyPayment),
                interestRate: interestRate ? parseFloat(interestRate) : null,
                dueDate: dueDate ? new Date(dueDate) : null,
            },
        })

        return NextResponse.json({ debt }, { status: 201 })
    } catch (error) {
        console.error('Error creating debt:', error)
        return NextResponse.json({ error: 'Gagal menambahkan utang' }, { status: 500 })
    }
}
