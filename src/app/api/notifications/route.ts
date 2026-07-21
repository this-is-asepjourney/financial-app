import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cleanupOldNotifications, checkBudgetAlerts, checkGoalAlerts, checkDebtAlerts } from '@/lib/notification-service'

// GET /api/notifications
export async function GET(_req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        // Jalankan background check untuk budget, goals, & hutang saat mengambil notifikasi
        // Fire and forget, jangan ditunggu agar tidak memperlambat response
        cleanupOldNotifications(30).catch(console.error)
        checkBudgetAlerts(userId).catch(console.error)
        checkGoalAlerts(userId).catch(console.error)
        checkDebtAlerts(userId).catch(console.error)

        const notifications = await prisma.notification.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 50, // Batasi 50 notifikasi terbaru
        })

        const unreadCount = await prisma.notification.count({
            where: {
                userId,
                isRead: false,
            }
        })

        return NextResponse.json({ notifications, unreadCount })
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// PATCH /api/notifications (Mark as read)
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id
        const body = await req.json()
        const { notificationId, markAll } = body

        if (markAll) {
            await prisma.notification.updateMany({
                where: {
                    userId,
                    isRead: false,
                },
                data: {
                    isRead: true,
                },
            })
            return NextResponse.json({ success: true, message: 'All notifications marked as read' })
        }

        if (!notificationId) {
            return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
        }

        const notification = await prisma.notification.update({
            where: {
                id: notificationId,
                userId, // Pastikan milik user yang login
            },
            data: {
                isRead: true,
            },
        })

        return NextResponse.json({ success: true, notification })
    } catch (error) {
        console.error('Error updating notification:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// DELETE /api/notifications (Delete individual notification)
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
        }

        await prisma.notification.delete({
            where: {
                id,
                userId, // Pastikan milik user yang login
            }
        })

        return NextResponse.json({ success: true, message: 'Notification deleted' })
    } catch (error) {
        console.error('Error deleting notification:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
