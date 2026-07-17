import os

filepath = 'src/app/(dashboard)/debts/page.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Icons
content = content.replace('import { Plus, Trash2, Edit', 'import { Plus, Trash2, Edit, CheckCircle')

# 2. Interfaces
interfaces = """interface Debt {
    id: string
    name: string
    debtType: string
    type: string
    totalAmount: number
    remainingAmount: number
    monthlyPayment: number
    interestRate: number | null
    dueDate: string | null
    createdAt: string
}

interface Wallet {
    id: string
    name: string
    type: string
}"""
content = content.replace("interface Debt {", interfaces.replace("interface Debt {\n    id: string\n    name: string\n    debtType: string\n    type: string\n    totalAmount: number\n    remainingAmount: number\n    monthlyPayment: number\n    interestRate: number | null\n    dueDate: string | null\n    createdAt: string\n}", "interface Debt {\n    id: string\n    name: string\n    debtType: string\n    type: string\n    totalAmount: number\n    remainingAmount: number\n    monthlyPayment: number\n    interestRate: number | null\n    dueDate: string | null\n    createdAt: string\n}"))

# 3. States
states = """    const [debts, setDebts] = useState<Debt[]>([])
    const [wallets, setWallets] = useState<Wallet[]>([])
    const [summary, setSummary] = useState<DebtSummary | null>(null)"""
content = content.replace("    const [debts, setDebts] = useState<Debt[]>([])\n    const [summary, setSummary] = useState<DebtSummary | null>(null)", states)

states2 = """    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showPayForm, setShowPayForm] = useState(false)
    const [payingDebt, setPayingDebt] = useState<Debt | null>(null)
    const [selectedWalletId, setSelectedWalletId] = useState('')"""
content = content.replace("    const [isSubmitting, setIsSubmitting] = useState(false)", states2)

# 4. Fetch wallets in fetchDebts
fetch_debts = """        try {
            const [debtsRes, walletsRes] = await Promise.all([
                fetch('/api/debts'),
                fetch(`/api/wallets?userId=${user.id}`)
            ])
            
            if (debtsRes.ok) {
                const data = await debtsRes.json()
                setDebts(data.debts || [])
                setSummary(data.summary)
                setReceivableSummary(data.receivableSummary)
            }
            if (walletsRes.ok) {
                const wData = await walletsRes.json()
                setWallets(wData || [])
            }"""
content = content.replace("""        try {
            const res = await fetch('/api/debts')
            if (res.ok) {
                const data = await res.json()
                setDebts(data.debts || [])
                setSummary(data.summary)
                setReceivableSummary(data.receivableSummary)
            }""", fetch_debts)

# 5. Form changes
empty_form = """const EMPTY_FORM = {
    name: '',
    type: '',
    totalAmount: '',
    remainingAmount: '',
    monthlyPayment: '',
    interestRate: '',
    dueDate: '',
    walletId: '',
}"""
# Wait, replacing EMPTY_FORM using a regex or simple replace
content = content.replace("    dueDate: '',\n}", "    dueDate: '',\n    walletId: '',\n}")

# Fix setForm in openEditForm
content = content.replace("            dueDate: debt.dueDate ? new Date(debt.dueDate).toISOString().split('T')[0] : '',", "            dueDate: debt.dueDate ? new Date(debt.dueDate).toISOString().split('T')[0] : '',\n            walletId: '',")

# Update payload in handleSubmit
content = content.replace("            dueDate: form.dueDate || null,\n        }", "            dueDate: form.dueDate || null,\n            walletId: form.walletId || null,\n        }")

# 6. Add Pay logic
pay_logic = """    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!payingDebt) return
        setIsSubmitting(true)

        try {
            const res = await fetch(`/api/debts/${payingDebt.id}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletId: selectedWalletId }),
            })
            if (!res.ok) throw new Error()
            toast({ title: 'Berhasil', description: 'Pelunasan berhasil diproses' })
            setShowPayForm(false)
            fetchDebts()
        } catch {
            toast({ title: 'Error', description: 'Gagal memproses pelunasan', variant: 'destructive' })
        } finally {
            setIsSubmitting(false)
        }
    }
"""
# Insert pay logic before handleDelete
content = content.replace("    const handleDelete = async (debt: Debt) => {", pay_logic + "\n    const handleDelete = async (debt: Debt) => {")

# 7. Add Mark as Done button in the card
buttons = """                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-green-100 text-green-600"
                                                onClick={() => { setPayingDebt(debt); setSelectedWalletId(''); setShowPayForm(true); }}
                                                title="Tandai Lunas"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-primary/10"
                                                onClick={() => openEditForm(debt)}"""
content = content.replace("""                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-primary/10"
                                                onClick={() => openEditForm(debt)}""", buttons)

# 8. Add Wallet Dropdown in Add/Edit form
wallet_dropdown = """                            {!editingDebt && (
                                <div className="col-span-2 space-y-1.5">
                                    <Label>{activeTab === 'debt' ? 'Tujuan Dana (Opsional)' : 'Sumber Dana (Opsional)'}</Label>
                                    <Select value={form.walletId} onValueChange={v => setFormField('walletId', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih dompet pencairan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {wallets.map(w => (
                                                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">Jika dipilih, saldo dompet akan otomatis disesuaikan</p>
                                </div>
                            )}"""
# Insert wallet dropdown before DialogFooter
content = content.replace("                        </div>\n                        <DialogFooter>", "                        </div>\n" + wallet_dropdown + "\n                        <DialogFooter>")

# 9. Add Pay Dialog at the very end
pay_dialog = """
            {/* Pay Dialog */}
            <Dialog open={showPayForm} onOpenChange={setShowPayForm}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Tandai Lunas</DialogTitle>
                        <DialogDescription>
                            Pilih dompet tujuan pengembalian dana untuk <strong>{payingDebt?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePay} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Pilih Dompet</Label>
                            <Select required value={selectedWalletId} onValueChange={setSelectedWalletId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih dompet" />
                                </SelectTrigger>
                                <SelectContent>
                                    {wallets.map(w => (
                                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowPayForm(false)}>Batal</Button>
                            <Button type="submit" disabled={isSubmitting || !selectedWalletId}>
                                {isSubmitting ? 'Memproses...' : 'Selesai'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
"""
# Insert Pay Dialog before last closing div
content = content.replace("        </div>\n    )\n}", pay_dialog + "        </div>\n    )\n}")

with open(filepath, 'w') as f:
    f.write(content)

print("UI updated successfully.")
