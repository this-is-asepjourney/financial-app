import { prisma } from './prisma'

export type NotificationType = 'info' | 'warning' | 'success' | 'alert'

interface CreateNotificationParams {
    userId: string
    title: string
    message: string
    type?: NotificationType
}

/**
 * Buat notifikasi baru untuk pengguna
 */
export async function createNotification(params: CreateNotificationParams) {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId: params.userId,
                title: params.title,
                message: params.message,
                type: params.type || 'info',
            },
        })
        return notification
    } catch (error) {
        console.error('Error creating notification:', error)
        return null
    }
}

/**
 * Hapus notifikasi yang sudah lebih dari X hari (misal 30 hari)
 * Bisa dipanggil secara berkala atau saat ada aksi tertentu (misal saat user login/buka halaman)
 */
export async function cleanupOldNotifications(days: number = 30) {
    try {
        const dateLimit = new Date()
        dateLimit.setDate(dateLimit.getDate() - days)

        const result = await prisma.notification.deleteMany({
            where: {
                createdAt: {
                    lt: dateLimit,
                },
            },
        })
        return result
    } catch (error) {
        console.error('Error cleaning up notifications:', error)
        return null
    }
}

/**
 * Cek budget bulanan pengguna dan buat notifikasi jika budget sudah kritis (> 80%)
 * Ini dipanggil setelah transaksi ditambahkan
 */
export async function checkBudgetAlerts(userId: string) {
    try {
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const budgets = await prisma.budget.findMany({
            where: {
                userId,
                month: {
                    gte: startOfMonth,
                },
            },
            include: {
                category: true,
            },
        })

        for (const budget of budgets) {
            if (budget.amount > 0) {
                const percentage = (budget.spent / budget.amount) * 100
                
                // Jika pengeluaran > 80% dan < 100%
                if (percentage >= 80 && percentage < 100) {
                    // Cek apakah sudah ada notifikasi serupa hari ini untuk menghindari spam
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    
                    const existingNotif = await prisma.notification.findFirst({
                        where: {
                            userId,
                            title: {
                                contains: 'Saldo Menipis',
                            },
                            message: {
                                contains: budget.category.name,
                            },
                            createdAt: {
                                gte: today,
                            },
                        },
                    })

                    if (!existingNotif) {
                        await createNotification({
                            userId,
                            title: 'Peringatan Saldo Menipis',
                            message: `Saldo budget kategori ${budget.category.name} Anda hampir habis (terpakai ${percentage.toFixed(0)}%).`,
                            type: 'warning',
                        })
                    }
                } 
                // Jika pengeluaran >= 100%
                else if (percentage >= 100) {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    
                    const existingNotif = await prisma.notification.findFirst({
                        where: {
                            userId,
                            title: {
                                contains: 'Melampaui Batas',
                            },
                            message: {
                                contains: budget.category.name,
                            },
                            createdAt: {
                                gte: today,
                            },
                        },
                    })

                    if (!existingNotif) {
                        await createNotification({
                            userId,
                            title: 'Budget Melampaui Batas',
                            message: `Pengeluaran kategori ${budget.category.name} Anda telah melampaui batas budget bulan ini!`,
                            type: 'alert',
                        })
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error checking budget alerts:', error)
    }
}

/**
 * Cek financial goals dan beri notifikasi jika target tercapai (currentAmount >= targetAmount)
 */
export async function checkGoalAlerts(userId: string) {
    try {
        const goals = await prisma.financialGoal.findMany({
            where: {
                userId,
                status: 'active',
            },
        })

        for (const goal of goals) {
            if (goal.currentAmount >= goal.targetAmount) {
                // Tandai notifikasi sudah dikirim agar tidak dikirim ulang dengan mengubah status atau mencari notifikasi yang sudah ada
                const existingNotif = await prisma.notification.findFirst({
                    where: {
                        userId,
                        title: {
                            contains: 'Tercapai',
                        },
                        message: {
                            contains: goal.name,
                        },
                    },
                })

                if (!existingNotif) {
                    await createNotification({
                        userId,
                        title: 'Tujuan Finansial Tercapai! 🎉',
                        message: `Selamat! Anda telah mencapai target untuk tujuan finansial: ${goal.name}.`,
                        type: 'success',
                    })
                    
                    // Opsional: otomatis ubah status goal jadi completed
                    // await prisma.financialGoal.update({
                    //     where: { id: goal.id },
                    //     data: { status: 'completed' }
                    // })
                }
            }
        }
    } catch (error) {
        console.error('Error checking goal alerts:', error)
    }
}

/**
 * Cek tenggat waktu hutang (Debt) yang mendekati jatuh tempo
 */
export async function checkDebtAlerts(userId: string) {
    try {
        const debts = await prisma.debt.findMany({
            where: {
                userId,
                remainingAmount: { gt: 0 },
                dueDate: { not: null },
            },
        })

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        for (const debt of debts) {
            if (!debt.dueDate) continue

            const dueDate = new Date(debt.dueDate)
            dueDate.setHours(0, 0, 0, 0)
            
            const diffTime = dueDate.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            let type: NotificationType | null = null
            let title = ''
            let message = ''

            if (diffDays < 0) {
                type = 'alert'
                title = 'Tagihan Terlewat!'
                message = `Tagihan ${debt.name} sudah melewati batas waktu jatuh tempo.`
            } else if (diffDays <= 3) {
                type = 'warning'
                title = 'Tagihan Segera Jatuh Tempo'
                message = `Tagihan ${debt.name} akan jatuh tempo dalam ${diffDays} hari.`
            }

            if (type) {
                // Hindari spam notifikasi yang sama dalam 1 hari
                const existingNotif = await prisma.notification.findFirst({
                    where: {
                        userId,
                        title,
                        message,
                        createdAt: { gte: today },
                    }
                })

                if (!existingNotif) {
                    await createNotification({ userId, title, message, type })
                }
            }
        }
    } catch (error) {
        console.error('Error checking debt alerts:', error)
    }
}
