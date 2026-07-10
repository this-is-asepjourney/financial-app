import { z } from 'zod'

export const loginSchema = z.object({
    email: z.string().email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
})

export const registerSchema = z.object({
    name: z.string().min(2, 'Nama minimal 2 karakter'),
    email: z.string().email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
})

export const transactionSchema = z.object({
    amount: z.number().positive('Jumlah harus positif'),
    type: z.enum(['income', 'expense', 'transfer']),
    categoryId: z.string().optional(),
    walletId: z.string().optional(),
    toWalletId: z.string().optional(),
    description: z.string().optional(),
    date: z.coerce.date(),
    isRecurring: z.boolean(),
    recurringType: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
})

export const budgetSchema = z.object({
    categoryId: z.string().min(1, 'Kategori harus dipilih'),
    amount: z.number().positive('Jumlah harus positif'),
    month: z.coerce.date(),
    dueDate: z.coerce.date().optional(),
    isRecurring: z.boolean().optional().default(false),
})

export const goalSchema = z.object({
    name: z.string().min(1, 'Nama goal harus diisi'),
    targetAmount: z.number().positive('Target harus positif'),
    currentAmount: z.number().min(0).default(0),
    deadline: z.coerce.date().optional(),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
})

export const investmentSchema = z.object({
    name: z.string().min(1, 'Nama investasi harus diisi'),
    type: z.enum(['stocks', 'mutual_fund', 'crypto', 'deposit', 'property']),
    amount: z.number().positive('Jumlah harus positif'),
    currentValue: z.number().optional(),
    returns: z.number().optional(),
    startDate: z.coerce.date(),
    notes: z.string().optional(),
})

export const walletSchema = z.object({
    name: z.string().min(1, 'Nama dompet harus diisi'),
    type: z.enum(['bank', 'ewallet', 'cash']),
    balance: z.number().default(0),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type TransactionInput = z.infer<typeof transactionSchema>
export type BudgetInput = z.infer<typeof budgetSchema>
export type GoalInput = z.infer<typeof goalSchema>
export type InvestmentInput = z.infer<typeof investmentSchema>
export type WalletInput = z.infer<typeof walletSchema>