import re

file_path = r'd:\repository\financial-app\src\app\(dashboard)\dashboard\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Summary Cards: add truncate and shrink text size for mobile
content = re.sub(
    r'<div className="text-xl lg:text-2xl font-bold ([^"]+)">',
    r'<div className="text-lg sm:text-xl lg:text-2xl font-bold truncate \1">',
    content
)

# Fix Grids to explicitly define grid-cols-1 for mobile
content = content.replace(
    '<div className="grid lg:grid-cols-2 gap-6">',
    '<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">'
)
content = content.replace(
    '<div className="grid lg:grid-cols-3 gap-6">',
    '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">'
)
content = content.replace(
    '<div className="grid lg:grid-cols-2 gap-6 mt-6">',
    '<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">'
)

# Fix Title in Dashboard Header
content = content.replace(
    '<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">',
    '<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">'
)

# Fix Budget Card Progress Bar Name Truncate
old_budget = """                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: b.category?.color || '#cbd5e1' }} />
                                                    <span className="font-medium">{b.category?.name}</span>
                                                </div>
                                                <span className="text-muted-foreground font-medium text-xs">"""
new_budget = """                                                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.category?.color || '#cbd5e1' }} />
                                                    <span className="font-medium truncate">{b.category?.name}</span>
                                                </div>
                                                <span className="text-muted-foreground font-medium text-xs shrink-0">"""
content = content.replace(old_budget, new_budget)

# Fix Goals Truncate
old_goal = """                                                <span className="font-medium line-clamp-1">{g.name}</span>
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">{percent}%</span>"""
new_goal = """                                                <span className="font-medium truncate mr-2">{g.name}</span>
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0">{percent}%</span>"""
content = content.replace(old_goal, new_goal)

# Fix Debts List Layout
old_debt = """                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${d.type === 'debt' ? 'bg-rose-100 text-rose-600' : 'bg-teal-100 text-teal-600'}`}>
                                                {d.type === 'debt' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm leading-tight">{d.personName}</p>
                                                <p className="text-[11px] text-muted-foreground">{d.type === 'debt' ? 'Anda berutang' : 'Berutang ke Anda'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">"""
new_debt = """                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${d.type === 'debt' ? 'bg-rose-100 text-rose-600' : 'bg-teal-100 text-teal-600'}`}>
                                                {d.type === 'debt' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-sm leading-tight truncate">{d.personName}</p>
                                                <p className="text-[11px] text-muted-foreground">{d.type === 'debt' ? 'Anda berutang' : 'Berutang ke Anda'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-2">"""
content = content.replace(old_debt, new_debt)

# Fix Transactions List Layout
old_tx = """                                <div key={tx.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                            tx.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50' 
                                            : tx.type === 'expense' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/50'
                                            : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50'
                                        }`}>
                                            {tx.type === 'income' ? <ArrowDownRight className="h-5 w-5" /> : tx.type === 'expense' ? <ArrowUpRight className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm sm:text-base leading-tight">
                                                {tx.description || tx.category?.name || 'Transaksi'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-[11px] sm:text-xs text-muted-foreground">
                                                <span>{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                <span className="hidden sm:inline">•</span>
                                                <span className="hidden sm:flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tx.category?.color || '#cbd5e1' }} />
                                                    {tx.category?.name || 'Lainnya'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">"""

new_tx = """                                <div key={tx.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                            tx.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50' 
                                            : tx.type === 'expense' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/50'
                                            : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50'
                                        }`}>
                                            {tx.type === 'income' ? <ArrowDownRight className="h-5 w-5" /> : tx.type === 'expense' ? <ArrowUpRight className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
                                        </div>
                                        <div className="min-w-0 flex-1 pr-2">
                                            <p className="font-medium text-sm sm:text-base leading-tight truncate">
                                                {tx.description || tx.category?.name || 'Transaksi'}
                                            </p>
                                            <div className="flex items-center gap-1.5 sm:gap-2 mt-1 text-[11px] sm:text-xs text-muted-foreground truncate">
                                                <span className="shrink-0">{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                <span className="shrink-0">•</span>
                                                <span className="flex items-center gap-1 min-w-0 truncate">
                                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tx.category?.color || '#cbd5e1' }} />
                                                    <span className="truncate">{tx.category?.name || 'Lainnya'}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-2">"""

content = content.replace(old_tx, new_tx)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
