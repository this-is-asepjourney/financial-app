import re
import os

filepath = 'src/app/(dashboard)/debts/page.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# 1. Update interface Debt
content = content.replace('interface Debt {\n    id: string\n    name: string', 'interface Debt {\n    id: string\n    name: string\n    debtType: string')

# 2. Add RECEIVABLE_TYPES and Icons
content = content.replace('import { Plus, Trash2, Edit, CreditCard, Home, Car, Banknote, Smartphone, ShoppingBag, BadgePercent, TrendingDown, Percent, Calendar, RefreshCw, X, AlertCircle } from \'lucide-react\'', 
                          'import { Plus, Trash2, Edit, CreditCard, Home, Car, Banknote, Smartphone, ShoppingBag, BadgePercent, TrendingDown, Percent, Calendar, RefreshCw, X, AlertCircle, Users, HandCoins, Building, Wallet, ArrowDownToLine, ArrowUpFromLine } from \'lucide-react\'')

receivable_types = """
const RECEIVABLE_TYPES = [
    { value: 'teman', label: 'Teman/Keluarga', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { value: 'kasbon', label: 'Kasbon Karyawan/Pekerjaan', icon: Building, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { value: 'pinjaman', label: 'Pinjaman Pribadi', icon: HandCoins, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { value: 'lainnya', label: 'Piutang Lainnya', icon: Wallet, color: 'text-gray-600', bg: 'bg-gray-100' },
]

const getReceivableTypeInfo = (type: string) => {
    return RECEIVABLE_TYPES.find(t => t.value === type) || RECEIVABLE_TYPES[RECEIVABLE_TYPES.length - 1]
}
"""

content = content.replace('const getDebtTypeInfo = (type: string) => {', receivable_types + '\nconst getDebtTypeInfo = (type: string) => {')

# 3. Add activeTab and receivableSummary state
states = """    const [debts, setDebts] = useState<Debt[]>([])
    const [summary, setSummary] = useState<DebtSummary | null>(null)
    const [receivableSummary, setReceivableSummary] = useState<DebtSummary | null>(null)
    const [activeTab, setActiveTab] = useState<'debt' | 'receivable'>('debt')"""

content = content.replace('    const [debts, setDebts] = useState<Debt[]>([])\n    const [summary, setSummary] = useState<DebtSummary | null>(null)', states)

# 4. Update fetchDebts
fetch_debts = """                setDebts(data.debts || [])
                setSummary(data.summary)
                setReceivableSummary(data.receivableSummary)"""
content = content.replace('                setDebts(data.debts || [])\n                setSummary(data.summary)', fetch_debts)

# 5. Update EMPTY_FORM
content = content.replace('    type: \'kartu_kredit\',', '    type: \'\',')

# 6. Update openAddForm and form states
content = content.replace('setForm(EMPTY_FORM)', "setForm({ ...EMPTY_FORM, type: activeTab === 'debt' ? 'kartu_kredit' : 'teman' })")

# 7. Update handleSubmit
payload_replace = """        const payload = {
            name: form.name,
            type: form.type,
            debtType: activeTab,
            totalAmount: form.totalAmount.replace(/\D/g, ''),"""
content = content.replace("""        const payload = {
            name: form.name,
            type: form.type,
            totalAmount: form.totalAmount.replace(/\D/g, ''),""", payload_replace)

# 8. Update UI - Tabs
tabs_ui = """            {/* Tabs */}
            <div className="flex border-b border-border">
                <button 
                    onClick={() => setActiveTab('debt')} 
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'debt' ? 'text-red-600' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <ArrowUpFromLine className="w-4 h-4" />
                    Utang
                    {activeTab === 'debt' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />}
                </button>
                <button 
                    onClick={() => setActiveTab('receivable')} 
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'receivable' ? 'text-emerald-600' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <ArrowDownToLine className="w-4 h-4" />
                    Piutang
                    {activeTab === 'receivable' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />}
                </button>
            </div>

            {/* Summary Cards */}"""

content = content.replace('            {/* Summary Cards */}', tabs_ui)

# 9. Dynamic Summary Display
summary_logic = """            {/* Summary Cards */}
            {(activeTab === 'debt' ? summary : receivableSummary) && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className={`bg-gradient-to-br border ${activeTab === 'debt' ? 'from-red-500/10 border-red-500/20' : 'from-emerald-500/10 border-emerald-500/20'}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className={`text-sm font-medium flex items-center gap-1.5 ${activeTab === 'debt' ? 'text-red-600' : 'text-emerald-600'}`}>
                                <TrendingDown className="h-4 w-4" /> {activeTab === 'debt' ? 'Total Sisa Utang' : 'Total Sisa Piutang'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-xl sm:text-2xl font-bold ${activeTab === 'debt' ? 'text-red-600' : 'text-emerald-600'}`}>
                                {formatCurrency((activeTab === 'debt' ? summary : receivableSummary)!.totalRemainingAmount)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Dari {formatCurrency((activeTab === 'debt' ? summary : receivableSummary)!.totalOriginalAmount)} total</p>
                        </CardContent>
                    </Card>
                    <Card className={`bg-gradient-to-br border ${activeTab === 'debt' ? 'from-orange-500/10 border-orange-500/20' : 'from-blue-500/10 border-blue-500/20'}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className={`text-sm font-medium flex items-center gap-1.5 ${activeTab === 'debt' ? 'text-orange-600' : 'text-blue-600'}`}>
                                <Calendar className="h-4 w-4" /> {activeTab === 'debt' ? 'Cicilan/Bulan' : 'Estimasi Masuk/Bulan'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-xl sm:text-2xl font-bold ${activeTab === 'debt' ? 'text-orange-600' : 'text-blue-600'}`}>
                                {formatCurrency((activeTab === 'debt' ? summary : receivableSummary)!.totalMonthlyPayment)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{activeTab === 'debt' ? 'Total kewajiban bulanan' : 'Total pemasukan bulanan'}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-500/10 to-background border-green-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-1.5">
                                <Percent className="h-4 w-4" /> {activeTab === 'debt' ? 'Sudah Terlunasi' : 'Sudah Dibayar'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold text-green-600">
                                {formatCurrency(((activeTab === 'debt' ? summary : receivableSummary)!.totalOriginalAmount) - ((activeTab === 'debt' ? summary : receivableSummary)!.totalRemainingAmount))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Total pembayaran masuk</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-indigo-500/10 to-background border-indigo-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-indigo-600 flex items-center gap-1.5">
                                <AlertCircle className="h-4 w-4" /> Total {activeTab === 'debt' ? 'Utang' : 'Piutang'} Aktif
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold text-indigo-600">{(activeTab === 'debt' ? summary : receivableSummary)!.count}</div>
                            <p className="text-xs text-muted-foreground mt-1">Yang sedang berjalan</p>
                        </CardContent>
                    </Card>
                </div>
            )}"""

# Replace the existing summary cards
start_idx = content.find('{summary && (')
end_idx = content.find('{/* Main Content - Empty State or List */}')
if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + summary_logic + '\n\n            ' + content[end_idx:]

# 10. Filter debts in list
content = content.replace('debts.length === 0', 'debts.filter(d => d.debtType === activeTab).length === 0')
content = content.replace('debts.map((debt) =>', 'debts.filter(d => d.debtType === activeTab).map((debt) =>')

# 11. Fix specific labels like 'Kreditor/Nama Utang'
content = content.replace('Kreditor / Nama Utang', "{activeTab === 'debt' ? 'Kreditor / Nama Utang' : 'Peminjam / Nama Piutang'}")
content = content.replace('Misal: KPR BCA, Kartu Kredit Mandiri', "{activeTab === 'debt' ? 'Misal: KPR BCA, Kartu Kredit Mandiri' : 'Misal: Budi, Kasbon Karyawan'}")
content = content.replace('Total Pinjaman / Plafon', "{activeTab === 'debt' ? 'Total Pinjaman / Plafon' : 'Total Dipinjamkan'}")

# 12. Fix Type Options in Form
types_dropdown = """                                        <select
                                            required
                                            value={form.type}
                                            onChange={e => setFormField('type', e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {(activeTab === 'debt' ? DEBT_TYPES : RECEIVABLE_TYPES).map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>"""
                                        
select_start = content.find('<select\n                                            required\n                                            value={form.type}')
if select_start != -1:
    select_end = content.find('</select>', select_start) + 9
    content = content[:select_start] + types_dropdown + content[select_end:]

# 13. Fix getDebtTypeInfo usage
content = content.replace('const typeInfo = getDebtTypeInfo(debt.type)', 'const typeInfo = activeTab === \\\'debt\\\' ? getDebtTypeInfo(debt.type) : getReceivableTypeInfo(debt.type)')

# 14. Fix title
content = content.replace('Tambah Utang Baru', "{activeTab === 'debt' ? 'Tambah Utang Baru' : 'Tambah Piutang Baru'}")
content = content.replace('Edit Data Utang', "{activeTab === 'debt' ? 'Edit Data Utang' : 'Edit Data Piutang'}")
content = content.replace('>Tambah Utang<', ">{activeTab === 'debt' ? 'Tambah Utang' : 'Tambah Piutang'}<")

# 15. Fix empty state
content = content.replace('Belum ada data utang yang ditambahkan.', "{activeTab === 'debt' ? 'Belum ada data utang yang ditambahkan.' : 'Belum ada data piutang yang ditambahkan.'}")

with open(filepath, 'w') as f:
    f.write(content)
print("Updated debts page!")
