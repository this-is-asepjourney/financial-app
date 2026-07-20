import re

file_path = r'd:\repository\financial-app\src\app\(dashboard)\settings\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
old_import = "import { User, Mail, Save, Lock, Wallet, Shield, Settings2, CreditCard, Calendar } from 'lucide-react'"
new_import = "import { User, Mail, Save, Lock, Wallet, Shield, Settings2, CreditCard, Calendar } from 'lucide-react'\nimport { IncomeSourcesManager } from '@/components/settings/IncomeSourcesManager'"
content = content.replace(old_import, new_import)

# Replace target pemasukan with total display + manager
old_ui = """                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Target Pemasukan Bulanan</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={monthlyIncome}
                                            onChange={(e) => setMonthlyIncome(e.target.value)}
                                            type="number"
                                            className="pl-10"
                                            placeholder="Contoh: 10000000"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Gunakan angka saja tanpa titik/koma (misal: 15000000)</p>
                                </div>"""
new_ui = """                                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <IncomeSourcesManager onTotalUpdate={(total) => setMonthlyIncome(total.toString())} />
                                    
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl flex items-center justify-between border border-slate-200 dark:border-slate-800">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-slate-500">Estimasi Total Pemasukan Bulanan</p>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                                Rp{parseFloat(monthlyIncome || '0').toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                        <CreditCard className="h-8 w-8 text-indigo-500/20" />
                                    </div>
                                </div>"""
content = content.replace(old_ui, new_ui)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
