import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // Create demo user
    const passwordHash = await bcrypt.hash('password123', 12)

    const user = await prisma.user.upsert({
        where: { email: 'demo@example.com' },
        update: {},
        create: {
            name: 'Demo User',
            email: 'demo@example.com',
            passwordHash,
            monthlyIncome: 8000000,
        },
    })

    console.log('Created user:', user.email)

    // Create categories
    const categories = [
        { name: 'Gaji', type: 'income', icon: 'briefcase', color: '#10B981' },
        { name: 'Freelance', type: 'income', icon: 'laptop', color: '#3B82F6' },
        { name: 'Investasi', type: 'income', icon: 'trending-up', color: '#8B5CF6' },
        { name: 'Makanan', type: 'expense', icon: 'utensils', color: '#EF4444' },
        { name: 'Transport', type: 'expense', icon: 'car', color: '#F59E0B' },
        { name: 'Belanja', type: 'expense', icon: 'shopping-cart', color: '#EC4899' },
        { name: 'Hiburan', type: 'expense', icon: 'film', color: '#6366F1' },
        { name: 'Tagihan', type: 'expense', icon: 'file-text', color: '#14B8A6' },
    ]

    for (const cat of categories) {
        await prisma.category.create({
            data: {
                userId: user.id,
                ...cat,
            },
        })
    }

    console.log('Created categories')

    // Create sample transactions
    const transactionData = []
    const now = new Date()

    for (let i = 0; i < 30; i++) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)

        // Random income
        if (i === 0 || i === 15) {
            transactionData.push({
                userId: user.id,
                type: 'income',
                amount: 8000000,
                description: 'Gaji bulanan',
                date,
            })
        }

        // Random expenses
        const expenses = [
            { amount: 50000, description: 'Makan siang', type: 'expense' },
            { amount: 150000, description: 'Bensin', type: 'expense' },
            { amount: 200000, description: 'Belanja bulanan', type: 'expense' },
            { amount: 100000, description: 'Nonton film', type: 'expense' },
        ]

        for (const exp of expenses) {
            if (Math.random() > 0.3) {
                transactionData.push({
                    userId: user.id,
                    ...exp,
                    date,
                })
            }
        }
    }

    await prisma.transaction.createMany({
        data: transactionData,
    })

    console.log('Created sample transactions')

    // Create financial goals
    await prisma.financialGoal.createMany({
        data: [
            {
                userId: user.id,
                name: 'Dana Darurat',
                targetAmount: 24000000,
                currentAmount: 15000000,
                priority: 'high',
                status: 'active',
            },
            {
                userId: user.id,
                name: 'Liburan Akhir Tahun',
                targetAmount: 10000000,
                currentAmount: 3000000,
                priority: 'medium',
                status: 'active',
            },
            {
                userId: user.id,
                name: 'Beli Laptop Baru',
                targetAmount: 15000000,
                currentAmount: 8000000,
                priority: 'low',
                status: 'active',
            },
        ],
    })

    console.log('Created financial goals')
    console.log('Seed completed!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })