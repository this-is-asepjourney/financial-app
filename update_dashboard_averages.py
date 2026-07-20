import re

file_path = r'd:\repository\financial-app\src\app\(dashboard)\dashboard\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the DashboardData interface
old_interface = """    allTimeCategoryData: {
        categoryName: string
        totalAmount: number
        percentage: number
        color: string
    }[]
    allTimeTotalExpenses: number"""
new_interface = """    allTimeCategoryData: {
        categoryName: string
        totalAmount: number
        percentage: number
        color: string
    }[]
    allTimeTotalExpenses: number
    firstTransactionDate: string | null"""
content = content.replace(old_interface, new_interface)

# 2. Update setData to include firstTransactionDate
old_set_data = """                categoryData: category.analysis || [],
                allTimeCategoryData: allTimeCategory.analysis || [],
                allTimeTotalExpenses: allTimeCategory.totalAmount || 0,"""
new_set_data = """                categoryData: category.analysis || [],
                allTimeCategoryData: allTimeCategory.analysis || [],
                allTimeTotalExpenses: allTimeCategory.totalAmount || 0,
                firstTransactionDate: allTimeCategory.firstTransactionDate || null,"""
content = content.replace(old_set_data, new_set_data)

# 3. Add import for calculation inside component or use Date logic directly
# We can just use standard Date math in the render block.
old_import = "import { Button } from '@/components/ui/button'"
new_import = "import { Button } from '@/components/ui/button'\nimport { CalendarDays, AlertTriangle } from 'lucide-react'"
content = content.replace(old_import, new_import)

# 4. Replace the "Total Pengeluaran (Semua Waktu)" Card with the new Analysis layout
old_row5 = """            {/* Row 5: Detailed Charts (Category All Time) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60">
                    <CardHeader>
                        <CardTitle>Total Pengeluaran (Semua Waktu)</CardTitle>
                        <CardDescription>Akumulasi sejak Anda menggunakan aplikasi.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center items-center h-[280px]">
                        <div className="p-6 rounded-full bg-rose-50 dark:bg-rose-950/30 mb-6">
                            <TrendingDown className="h-12 w-12 text-rose-500" />
                        </div>
                        <div className="text-4xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
                            {formatCurrency(data?.allTimeTotalExpenses || 0)}
                        </div>
                    </CardContent>
                </Card>"""

new_row5 = """            {/* Row 5: Detailed Charts (Category All Time) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60">
                    <CardHeader>
                        <CardTitle>Analisis Pengeluaran (Semua Waktu)</CardTitle>
                        <CardDescription>Ringkasan dan rata-rata sejak transaksi pertama Anda.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const total = data?.allTimeTotalExpenses || 0;
                            const firstDateStr = data?.firstTransactionDate;
                            let daysDiff = 1;
                            
                            if (firstDateStr) {
                                const first = new Date(firstDateStr).getTime();
                                const now = new Date().getTime();
                                const diff = Math.max(1, Math.ceil((now - first) / (1000 * 60 * 60 * 24)));
                                daysDiff = diff;
                            }
                            
                            const avgDaily = total / daysDiff;
                            const avgMonthly = total / (daysDiff / 30.44);
                            
                            // Find highest category
                            let mostExpense = { name: '-', amount: 0, color: '#ccc' };
                            if (data?.allTimeCategoryData && data.allTimeCategoryData.length > 0) {
                                const sorted = [...data.allTimeCategoryData].sort((a, b) => b.totalAmount - a.totalAmount);
                                mostExpense = {
                                    name: sorted[0].categoryName,
                                    amount: sorted[0].totalAmount,
                                    color: sorted[0].color
                                };
                            }

                            return (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-100 dark:border-rose-900/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingDown className="h-4 w-4 text-rose-500" />
                                            <span className="text-sm font-medium text-rose-700 dark:text-rose-400">Total Pengeluaran</span>
                                        </div>
                                        <div className="text-xl font-bold text-rose-700 dark:text-rose-400 truncate">
                                            {formatCurrency(total)}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            <span className="text-sm font-medium text-amber-700 dark:text-amber-400 truncate">Pengeluaran Terbesar</span>
                                        </div>
                                        <div className="text-lg font-bold text-amber-700 dark:text-amber-400 truncate flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: mostExpense.color }} />
                                            <span className="truncate">{mostExpense.name}</span>
                                        </div>
                                        <div className="text-xs text-amber-600/70 dark:text-amber-400/70 truncate mt-1">
                                            {formatCurrency(mostExpense.amount)}
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CalendarDays className="h-4 w-4 text-indigo-500" />
                                            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Rata-rata Bulanan</span>
                                        </div>
                                        <div className="text-lg font-bold text-indigo-700 dark:text-indigo-400 truncate">
                                            {formatCurrency(avgMonthly)}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CalendarClock className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Rata-rata Harian</span>
                                        </div>
                                        <div className="text-lg font-bold text-blue-700 dark:text-blue-400 truncate">
                                            {formatCurrency(avgDaily)}
                                        </div>
                                    </div>
                                </div>
                            )
                        })()}
                    </CardContent>
                </Card>"""

content = content.replace(old_row5, new_row5)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
