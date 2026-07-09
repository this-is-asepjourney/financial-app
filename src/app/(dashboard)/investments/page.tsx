'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Plus } from 'lucide-react'

export default function InvestmentsPage() {
    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Investasi</h1>
                    <p className="text-muted-foreground">Kelola portofolio investasi Anda</p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Investasi
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-teal-600" />
                        Portfolio Investasi
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">Fitur Investasi</p>
                        <p className="text-sm">
                            Fitur ini akan segera hadir. Anda dapat melacak saham, reksadana, crypto, dan investasi lainnya.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}