import re

file_path = r'd:\repository\financial-app\src\app\(dashboard)\financial-health\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
old_imp = """    RefreshCw,
    Calculator
} from 'lucide-react'"""
new_imp = """    RefreshCw,
    Calculator,
    AlertTriangle,
    CheckCircle
} from 'lucide-react'"""
content = content.replace(old_imp, new_imp)

# 2. Render Burn Rate Alert Function and Placement
# We will place it right above the Right Column content
old_right = """                {/* Right Column: Methodology & Educational Breakdown */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-sm">"""
new_right = """                {/* Right Column: Methodology & Educational Breakdown */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Burn Rate Alert */}
                    {(() => {
                        const payday = realData.paydayDate || 1;
                        const now = new Date();
                        const currentDay = now.getDate();
                        const currentMonth = now.getMonth();
                        const currentYear = now.getFullYear();

                        let lastPaydayDate = new Date(currentYear, currentMonth, payday);
                        let nextPaydayDate = new Date(currentYear, currentMonth + 1, payday);

                        if (currentDay < payday) {
                            lastPaydayDate = new Date(currentYear, currentMonth - 1, payday);
                            nextPaydayDate = new Date(currentYear, currentMonth, payday);
                        }

                        const totalDays = Math.max(1, (nextPaydayDate.getTime() - lastPaydayDate.getTime()) / (1000 * 60 * 60 * 24));
                        const daysPassed = Math.max(0, (now.getTime() - lastPaydayDate.getTime()) / (1000 * 60 * 60 * 24));
                        const daysLeft = Math.max(0, (nextPaydayDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        
                        const timeSpentPct = daysPassed / totalDays;
                        const moneySpentPct = realData.monthlyIncome > 0 ? (realData.monthlyExpenses / realData.monthlyIncome) : 0;

                        const isBoros = moneySpentPct > (timeSpentPct + 0.15); // 15% tolerance
                        const isSafe = moneySpentPct <= (timeSpentPct + 0.05);

                        return (
                            <Card className={`border-l-4 ${isBoros ? 'border-l-rose-500 bg-rose-50 dark:bg-rose-950/20' : isSafe ? 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20'}`}>
                                <CardContent className="p-5 flex items-start gap-4">
                                    {isBoros ? <AlertTriangle className="h-6 w-6 text-rose-500 mt-1 shrink-0" /> : isSafe ? <CheckCircle className="h-6 w-6 text-emerald-500 mt-1 shrink-0" /> : <Info className="h-6 w-6 text-amber-500 mt-1 shrink-0" />}
                                    <div className="space-y-2">
                                        <h4 className={`font-semibold ${isBoros ? 'text-rose-700 dark:text-rose-400' : isSafe ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                            {isBoros ? 'Peringatan: Pengeluaran Anda Terlalu Cepat (Boros)!' : isSafe ? 'Bagus! Kecepatan Pengeluaran Anda Terkendali.' : 'Perhatikan Kecepatan Pengeluaran Anda.'}
                                        </h4>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                            Gajian berikutnya dalam <strong>{Math.ceil(daysLeft)} hari</strong> (Tgl {payday}).<br/>
                                            Waktu sejak gajian lalu: <strong>{(timeSpentPct * 100).toFixed(0)}%</strong> berlalu, 
                                            tetapi Anda sudah menghabiskan <strong>{(moneySpentPct * 100).toFixed(0)}%</strong> dari total pemasukan.
                                        </p>
                                        {isBoros && (
                                            <p className="text-sm text-rose-600 font-medium">
                                                Saldo Anda berisiko habis sebelum waktu gajian tiba. Kurangi pengeluaran 'Wants' (keinginan) Anda sekarang!
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })()}

                    <Card className="shadow-sm">"""
content = content.replace(old_right, new_right)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
