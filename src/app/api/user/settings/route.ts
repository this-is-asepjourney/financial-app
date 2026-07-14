import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, name, email, monthlyIncome, currency, currentPassword, newPassword } = body

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        // Fetch existing user to verify password if trying to change it
        const existingUser = await prisma.user.findUnique({
            where: { id }
        })

        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (email !== undefined) updateData.email = email
        if (monthlyIncome !== undefined) updateData.monthlyIncome = parseFloat(monthlyIncome)
        if (currency !== undefined) updateData.currency = currency

        // Handle password update if provided
        if (currentPassword && newPassword) {
            const isPasswordValid = await bcrypt.compare(currentPassword, existingUser.passwordHash)
            if (!isPasswordValid) {
                return NextResponse.json({ error: 'Password lama tidak sesuai' }, { status: 400 })
            }
            const salt = await bcrypt.genSalt(10)
            updateData.passwordHash = await bcrypt.hash(newPassword, salt)
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                monthlyIncome: true,
                currency: true
            }
        })

        return NextResponse.json({
            message: 'Pengaturan berhasil diperbarui',
            user: updatedUser
        })
    } catch (error) {
        console.error('Failed to update user settings:', error)
        return NextResponse.json(
            { error: 'Gagal memperbarui pengaturan' },
            { status: 500 }
        )
    }
}
