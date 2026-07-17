import os

filepath = 'src/app/(dashboard)/debts/page.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Add Coins icon
if 'Coins' not in content:
    content = content.replace(
        "import { Plus, CreditCard, CheckCircle, Edit, Trash2 } from 'lucide-react'",
        "import { Plus, CreditCard, CheckCircle, Edit, Trash2, Coins } from 'lucide-react'"
    )

# 2. Add state
if 'const [showInstallmentForm, setShowInstallmentForm] = useState(false)' not in content:
    content = content.replace(
        "const [showPayForm, setShowPayForm] = useState(false)",
        "const [showPayForm, setShowPayForm] = useState(false)\n    const [showInstallmentForm, setShowInstallmentForm] = useState(false)\n    const [installmentAmount, setInstallmentAmount] = useState('')"
    )

# 3. Add handlePayInstallment function
handle_func = """    const handlePayInstallment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.id || !payingDebt || !selectedWalletId || !installmentAmount) return
        
        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/debts/${payingDebt.id}/installment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(installmentAmount.replace(/\\D/g, '')),
                    walletId: selectedWalletId
                }),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Terjadi kesalahan saat memproses cicilan')
            }

            toast({ title: 'Berhasil', description: 'Cicilan berhasil dibayar' })
            setShowInstallmentForm(false)
            fetchDebts()
        } catch (error: unknown) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Gagal memproses cicilan',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
            setPayingDebt(null)
            setSelectedWalletId('')
            setInstallmentAmount('')
        }
    }"""

if 'const handlePayInstallment =' not in content:
    content = content.replace(
        "    const handlePay = async (e: React.FormEvent) => {",
        handle_func + "\n\n    const handlePay = async (e: React.FormEvent) => {"
    )

# 4. Add the button to the UI
button_html = """                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-blue-100 text-blue-600"
                                                onClick={() => { 
                                                    setPayingDebt(debt); 
                                                    setSelectedWalletId(''); 
                                                    setInstallmentAmount(debt.monthlyPayment.toString());
                                                    setShowInstallmentForm(true); 
                                                }}
                                                title="Bayar Cicilan"
                                            >
                                                <Coins className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-green-100 text-green-600\""""

content = content.replace("""                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-green-100 text-green-600\"""", button_html)


# 5. Add the Dialog for "Bayar Cicilan"
dialog_html = """            {/* Installment Dialog */}
            <Dialog open={showInstallmentForm} onOpenChange={setShowInstallmentForm}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{activeTab === 'debt' ? 'Bayar Cicilan Utang' : 'Terima Cicilan Piutang'}</DialogTitle>
                        <DialogDescription>
                            Masukkan nominal cicilan untuk <strong>{payingDebt?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePayInstallment} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nominal Cicilan (Rp)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground font-medium text-sm">Rp</span>
                                <Input
                                    required
                                    className="pl-9"
                                    value={installmentAmount ? parseInt(installmentAmount.toString().replace(/\\D/g, '') || '0').toLocaleString('id-ID') : ''}
                                    onChange={e => setInstallmentAmount(e.target.value.replace(/\\D/g, ''))}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{activeTab === 'debt' ? 'Sumber Dana' : 'Tujuan Dana'}</Label>
                            <Select required value={selectedWalletId} onValueChange={setSelectedWalletId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih dompet" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(wallets || []).map(w => (
                                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                                Sisa tagihan saat ini: Rp {payingDebt?.remainingAmount?.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowInstallmentForm(false)}>Batal</Button>
                            <Button type="submit" disabled={isSubmitting || !selectedWalletId || !installmentAmount}>
                                {isSubmitting ? 'Memproses...' : 'Selesai'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Pay Dialog (Lunas) */}"""

content = content.replace("{/* Pay Dialog */}", dialog_html)

with open(filepath, 'w') as f:
    f.write(content)

print("Installment feature added to UI")
