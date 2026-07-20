import re

file_path = r'd:\repository\financial-app\src\app\(dashboard)\settings\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State
old_state = """    // Finance State
    const [monthlyIncome, setMonthlyIncome] = useState(user?.monthlyIncome?.toString() || '0')
    const [currency, setCurrency] = useState(user?.currency || 'IDR')"""
new_state = """    // Finance State
    const [monthlyIncome, setMonthlyIncome] = useState(user?.monthlyIncome?.toString() || '0')
    const [currency, setCurrency] = useState(user?.currency || 'IDR')
    const [paydayDate, setPaydayDate] = useState(user?.paydayDate?.toString() || '1')"""
content = content.replace(old_state, new_state)

# 2. Sync State
old_sync = """        setMonthlyIncome(user?.monthlyIncome?.toString() || '0')
        setCurrency(user?.currency || 'IDR')
    }"""
new_sync = """        setMonthlyIncome(user?.monthlyIncome?.toString() || '0')
        setCurrency(user?.currency || 'IDR')
        setPaydayDate(user?.paydayDate?.toString() || '1')
    }"""
content = content.replace(old_sync, new_sync)

# 3. Payload
old_payload = """            } else if (activeTab === 'finance') {
                payload.monthlyIncome = parseFloat(monthlyIncome)
                payload.currency = currency"""
new_payload = """            } else if (activeTab === 'finance') {
                payload.monthlyIncome = parseFloat(monthlyIncome)
                payload.currency = currency
                payload.paydayDate = parseInt(paydayDate, 10)"""
content = content.replace(old_payload, new_payload)

# 4. Session Update
old_sess_update = """                    monthlyIncome: data.user.monthlyIncome,
                    currency: data.user.currency,"""
new_sess_update = """                    monthlyIncome: data.user.monthlyIncome,
                    currency: data.user.currency,
                    paydayDate: data.user.paydayDate,"""
content = content.replace(old_sess_update, new_sess_update)

# 5. Icon import
old_import = "import { User, Mail, Save, Lock, Wallet, Shield, Settings2, CreditCard } from 'lucide-react'"
new_import = "import { User, Mail, Save, Lock, Wallet, Shield, Settings2, CreditCard, Calendar } from 'lucide-react'"
content = content.replace(old_import, new_import)

# 6. UI
old_ui = """                                    <p className="text-xs text-muted-foreground mt-1">Gunakan angka saja tanpa titik/koma (misal: 15000000)</p>
                                </div>
                                <div className="pt-4">"""
new_ui = """                                    <p className="text-xs text-muted-foreground mt-1">Gunakan angka saja tanpa titik/koma (misal: 15000000)</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Tanggal Gajian Rutin (1-31)</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={paydayDate}
                                            onChange={(e) => setPaydayDate(e.target.value)}
                                            type="number"
                                            min="1"
                                            max="31"
                                            className="pl-10"
                                            placeholder="Contoh: 25"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Tanggal rutin pemasukan utama Anda untuk perhitungan pengeluaran mingguan.</p>
                                </div>
                                <div className="pt-4">"""
content = content.replace(old_ui, new_ui)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
