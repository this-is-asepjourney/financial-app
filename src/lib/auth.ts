import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password diperlukan")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.passwordHash) {
          throw new Error("Email atau password salah")
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isPasswordValid) {
          throw new Error("Email atau password salah")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          monthlyIncome: user.monthlyIncome,
          currency: user.currency,
          paydayDate: user.paydayDate,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.monthlyIncome = user.monthlyIncome
        token.currency = user.currency
        token.paydayDate = user.paydayDate
      }
      if (trigger === "update" && session?.user) {
        token.name = session.user.name
        token.monthlyIncome = session.user.monthlyIncome
        token.currency = session.user.currency
        token.paydayDate = session.user.paydayDate
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.monthlyIncome = token.monthlyIncome as number | null
        session.user.currency = token.currency as string | null
        session.user.paydayDate = token.paydayDate as number | null
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secret-key-for-development",
}

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
                    { name: 'Gaji', type: 'income', icon: 'zap', color: '#10B981' },
                    { name: 'Bonus', type: 'income', icon: 'gift', color: '#3B82F6' },
                    
                    // Essential Needs
                    { name: 'Makanan & Minuman', type: 'expense', icon: 'utensils', color: '#F59E0B' },
                    { name: 'Transportasi', type: 'expense', icon: 'car', color: '#8B5CF6' },
                    { name: 'Tagihan & Utilitas', type: 'expense', icon: 'home', color: '#64748B' },
                    
                    // Wants
                    { name: 'Hiburan', type: 'expense', icon: 'smile', color: '#EC4899' },
                    { name: 'Belanja', type: 'expense', icon: 'shopping', color: '#F43F5E' },
                ]
            }
        },
    })

    return { id: user.id, name: user.name, email: user.email }
}