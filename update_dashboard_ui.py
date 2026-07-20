import re

file_path = r'd:\repository\financial-app\src\app\(dashboard)\dashboard\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update lucide-react imports to include CreditCard and HandCoins
old_lucide = """    AlertCircle,
    RefreshCw,
} from 'lucide-react'"""
new_lucide = """    AlertCircle,
    RefreshCw,
    CreditCard,
    HandCoins,
} from 'lucide-react'"""
content = content.replace(old_lucide, new_lucide)

# 2. Update DashboardData interface
old_interface = """    allTimeTotalExpenses: number
    healthScore: {"""
new_interface = """    allTimeTotalExpenses: number
    debtsSummary: { totalRemaining: number, count: number }
    receivablesSummary: { totalRemaining: number, count: number }
    healthScore: {"""
content = content.replace(old_interface, new_interface)

# 3. Add state for totalWalletBalance and update fetchDashboardData to fetch debts
fetch_old = """            const [summaryRes, categoryRes, healthRes, walletsRes, allTimeCategoryRes] = await Promise.all([
                fetch(`/api/reports/monthly-summary?userId=${user?.id}`),
                fetch(`/api/reports/category-analysis?userId=${user?.id}`),
                fetch(`/api/financial-health?userId=${user?.id}`),
                fetch(`/api/wallets?userId=${user?.id}`),
                fetch(`/api/reports/category-analysis?userId=${user?.id}&timeframe=all`)
            ])"""
fetch_new = """            const [summaryRes, categoryRes, healthRes, walletsRes, allTimeCategoryRes, debtsRes] = await Promise.all([
                fetch(`/api/reports/monthly-summary?userId=${user?.id}`),
                fetch(`/api/reports/category-analysis?userId=${user?.id}`),
                fetch(`/api/financial-health?userId=${user?.id}`),
                fetch(`/api/wallets?userId=${user?.id}`),
                fetch(`/api/reports/category-analysis?userId=${user?.id}&timeframe=all`),
                fetch(`/api/debts`)
            ])"""
content = content.replace(fetch_old, fetch_new)

json_old = """            const allTimeCategory = await allTimeCategoryRes.json()
            
            if (walletsRes.ok) {"""
json_new = """            const allTimeCategory = await allTimeCategoryRes.json()
            let debtsSummary = { totalRemaining: 0, count: 0 }
            let receivablesSummary = { totalRemaining: 0, count: 0 }
            
            if (debtsRes.ok) {
                const debtsData = await debtsRes.json()
                const debts = debtsData.debts || []
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                debts.forEach((d: any) => {
                    if (d.type === 'debt') {
                        debtsSummary.totalRemaining += d.remainingAmount
                        debtsSummary.count++
                    } else if (d.type === 'receivable') {
                        receivablesSummary.totalRemaining += d.remainingAmount
                        receivablesSummary.count++
                    }
                })
            }
            
            if (walletsRes.ok) {"""
content = content.replace(json_old, json_new)

set_data_old = """                allTimeCategoryData: allTimeCategory.analysis || [],
                allTimeTotalExpenses: allTimeCategory.totalAmount || 0,
                healthScore: {"""
set_data_new = """                allTimeCategoryData: allTimeCategory.analysis || [],
                allTimeTotalExpenses: allTimeCategory.totalAmount || 0,
                debtsSummary,
                receivablesSummary,
                healthScore: {"""
content = content.replace(set_data_old, set_data_new)

# 4. Enhance Summary Cards in render
summary_cards_old = """            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(data?.summary.totalIncome || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Bulan ini</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(data?.summary.totalExpenses || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Bulan ini</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Saldo Seluruh Dompet</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(totalWalletBalance)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-green-600">
                            +{formatCurrency(data?.summary.balance || 0)} bulan ini
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tabungan Rate</CardTitle>
                        <PiggyBank className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {data?.summary.savingsRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">Dari pemasukan</p>
                    </CardContent>
                </Card>
            </div>"""

summary_cards_new = """            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background border-green-100 dark:border-green-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Pemasukan</CardTitle>
                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-green-700 dark:text-green-400">
                            {formatCurrency(data?.summary.totalIncome || 0)}
                        </div>
                        <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">Bulan ini</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background border-red-100 dark:border-red-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Pengeluaran</CardTitle>
                        <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-red-700 dark:text-red-400">
                            {formatCurrency(data?.summary.totalExpenses || 0)}
                        </div>
                        <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">Bulan ini</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-100 dark:border-blue-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Saldo Dompet</CardTitle>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-blue-700 dark:text-blue-400">
                            {formatCurrency(totalWalletBalance)}
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            +{formatCurrency(data?.summary.balance || 0)} bulan ini
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background border-purple-100 dark:border-purple-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">Rate Tabungan</CardTitle>
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                            <PiggyBank className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-purple-700 dark:text-purple-400">
                            {data?.summary.savingsRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">Dari pemasukan</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-background border-rose-100 dark:border-rose-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400">Sisa Utang</CardTitle>
                        <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg">
                            <CreditCard className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-rose-700 dark:text-rose-400">
                            {formatCurrency(data?.debtsSummary?.totalRemaining || 0)}
                        </div>
                        <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mt-1">{data?.debtsSummary?.count || 0} utang aktif</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background border-emerald-100 dark:border-emerald-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Sisa Piutang</CardTitle>
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                            <HandCoins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl lg:text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(data?.receivablesSummary?.totalRemaining || 0)}
                        </div>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">{data?.receivablesSummary?.count || 0} piutang aktif</p>
                    </CardContent>
                </Card>
            </div>"""
content = content.replace(summary_cards_old, summary_cards_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
