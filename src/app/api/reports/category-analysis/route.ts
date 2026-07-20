import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMonthRange } from '@/lib/utils'

export async function GET(request: Request) {
        try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id

        const { searchParams } = new URL(request.url)
        const month = searchParams.get('month')
        const type = searchParams.get('type') || 'expense'
        const timeframe = searchParams.get('timeframe')
        let dateFilter = {}
        if (timeframe !== 'all') {
            const date = month ? new Date(month) : new Date()
            const { start, end } = getMonthRange(date)
            dateFilter = { date: { gte: start, lte: end } }
        }

        const categorySpending = await prisma.transaction.groupBy({
            by: ['categoryId'],
            where: {
                userId,
                type,
                ...dateFilter,
            },
            _sum: { amount: true },
            _count: true,
        })

        const categoryIds = categorySpending
            .map((c: { categoryId: string | null }) => c.categoryId)
            .filter(Boolean) as string[]

        const categories = await prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, icon: true, color: true },
        })

        type CategoryType = { id: string; name: string; icon: string | null; color: string }
        const categoryMap = new Map<string, CategoryType>(categories.map((c: CategoryType) => [c.id, c]))

        const analysis = categorySpending.map((item: { categoryId: string | null; _sum: { amount: number | null }; _count: number }) => {
            const category = item.categoryId ? categoryMap.get(item.categoryId) : null
            return {
                categoryId: item.categoryId,
                categoryName: category?.name || 'Tanpa Kategori',
                icon: category?.icon,
                color: category?.color || '#6B7280',
                totalAmount: item._sum.amount || 0,
                transactionCount: item._count,
            }
        })

        const totalAmount = analysis.reduce((sum: number, item: { totalAmount: number }) => sum + item.totalAmount, 0)

        const analysisWithPercentage = analysis.map((item) => ({
            ...item,
            percentage: totalAmount > 0 ? (item.totalAmount / totalAmount) * 100 : 0,
        }))

        let firstTransactionDate = null
        if (timeframe === 'all') {
            const firstTx = await prisma.transaction.findFirst({
                where: { userId, type },
                orderBy: { date: 'asc' },
                select: { date: true }
            })
            if (firstTx) {
                firstTransactionDate = firstTx.date
            }
        }

        return NextResponse.json({
            analysis: analysisWithPercentage,
            totalAmount,
            firstTransactionDate
        })
    } catch (error) {
        console.error('Error analyzing categories:', error)
        return NextResponse.json(
            { error: 'Gagal menganalisis kategori' },
            { status: 500 }
        )
    }
}