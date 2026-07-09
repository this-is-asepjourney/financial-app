'use client'

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface CategoryData {
    categoryName: string
    totalAmount: number
    percentage: number
    color: string
}

interface CategoryBreakdownProps {
    data: CategoryData[]
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
    return (
        <ResponsiveContainer width="100%" height={400}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                        `${name || 'Unknown'} (${((percent || 0) * 100).toFixed(1)}%)`
                    }
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="totalAmount"
                    nameKey="categoryName"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value) => formatCurrency(Number(value || 0))}
                />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    )
}