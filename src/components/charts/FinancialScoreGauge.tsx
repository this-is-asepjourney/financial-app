'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FinancialScoreGaugeProps {
    score: number
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
    breakdown: Record<string, number>
}

const statusConfig = {
    excellent: {
        color: '#10B981',
        label: 'Sangat Baik',
        gradient: 'from-green-400 to-green-600',
    },
    good: {
        color: '#3B82F6',
        label: 'Baik',
        gradient: 'from-blue-400 to-blue-600',
    },
    fair: {
        color: '#F59E0B',
        label: 'Cukup',
        gradient: 'from-yellow-400 to-yellow-600',
    },
    poor: {
        color: '#EF4444',
        label: 'Perlu Perbaikan',
        gradient: 'from-red-400 to-red-600',
    },
    critical: {
        color: '#991B1B',
        label: 'Kritis',
        gradient: 'from-red-700 to-red-900',
    },
}

export function FinancialScoreGauge({
    score,
    status,
    breakdown,
}: FinancialScoreGaugeProps) {
    const config = statusConfig[status]

    return (
        <Card>
            <CardHeader>
                <CardTitle>Skor Kesehatan Finansial</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center space-y-6">
                    {/* Score Circle */}
                    <div className="relative w-48 h-48">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="96"
                                cy="96"
                                r="88"
                                fill="none"
                                stroke="#E5E7EB"
                                strokeWidth="12"
                            />
                            <circle
                                cx="96"
                                cy="96"
                                r="88"
                                fill="none"
                                stroke={config.color}
                                strokeWidth="12"
                                strokeDasharray={`${(score / 100) * 553} 553`}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold">{score}</span>
                            <span className="text-sm text-muted-foreground">/100</span>
                        </div>
                    </div>

                    {/* Status */}
                    <div
                        className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${config.gradient} text-white font-semibold`}
                    >
                        {config.label}
                    </div>

                    {/* Breakdown */}
                    <div className="w-full space-y-3">
                        <h4 className="font-semibold">Rincian Skor</h4>
                        {Object.entries(breakdown).map(([key, value]) => (
                            <div key={key} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="capitalize">
                                        {key === 'spend'
                                            ? 'Belanja'
                                            : key === 'save'
                                                ? 'Tabungan'
                                                : key === 'borrow'
                                                    ? 'Pinjaman'
                                                    : 'Perencanaan'}
                                    </span>
                                    <span className="font-medium">{value}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full bg-gradient-to-r ${config.gradient}`}
                                        style={{ width: `${value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}