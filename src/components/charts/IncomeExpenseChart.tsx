'use client'

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface IncomeExpenseChartProps {
    data: {
        month: string
        income: number
        expense: number
    }[]
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
    return (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip
                    formatter={(value) => formatCurrency(Number(value || 0))}
                    labelStyle={{ color: '#374151' }}
                />
                <Legend />
                <Bar
                    dataKey="income"
                    fill="#10B981"
                    name="Pemasukan"
                    radius={[4, 4, 0, 0]}
                />
                <Bar
                    dataKey="expense"
                    fill="#EF4444"
                    name="Pengeluaran"
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    )
}