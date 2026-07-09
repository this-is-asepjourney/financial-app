import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export async function createUser(name: string, email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
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