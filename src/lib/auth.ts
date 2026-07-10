import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export async function createUser(name: string, email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
            categories: {
                create: [
                    // Income
                    { name: 'Gaji', type: 'income', icon: '💰', color: '#10B981' },
                    { name: 'Bonus', type: 'income', icon: '🎁', color: '#3B82F6' },
                    
                    // Essential Needs
                    { name: 'Makanan & Minuman', type: 'expense', icon: '🍔', color: '#F59E0B' },
                    { name: 'Transportasi', type: 'expense', icon: '🚗', color: '#8B5CF6' },
                    { name: 'Tagihan & Utilitas', type: 'expense', icon: '💡', color: '#64748B' },
                    
                    // Financial Health References
                    { name: 'Cicilan Hutang', type: 'expense', icon: '💳', color: '#EF4444' }, // Detected as Debt
                    { name: 'Asuransi & BPJS', type: 'expense', icon: '🛡️', color: '#06B6D4' }, // Detected as Insurance
                    { name: 'Tabungan Pensiun', type: 'expense', icon: '👴', color: '#14B8A6' }, // Detected as Retirement
                    
                    // Wants
                    { name: 'Hiburan', type: 'expense', icon: '🎬', color: '#EC4899' },
                    { name: 'Belanja', type: 'expense', icon: '🛍️', color: '#F43F5E' },
                ]
            }
        },
    })

    return { id: user.id, name: user.name, email: user.email }
}

export async function verifyUser(email: string, password: string) {
    const user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user) return null

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) return null

    return { id: user.id, name: user.name, email: user.email }
}