import re

file_path = r'd:\repository\financial-app\src\app\(dashboard)\wallets\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add History icon import
content = content.replace('Info,', 'Info, History, ArrowDownRight, ArrowUpRight,')

# 2. Add Transaction interface
tx_interface = """
interface Transaction {
    id: string
    amount: number
    type: 'income' | 'expense' | 'transfer'
    description: string | null
    date: string
    wallet?: { name: string } | null
    toWallet?: { name: string } | null
}
"""
content = content.replace('interface Wallet {', tx_interface + '\ninterface Wallet {')

# 3. Add state for History
state_hooks = """
    const [historyWallet, setHistoryWallet] = useState<Wallet | null>(null)
    const [walletTransactions, setWalletTransactions] = useState<Transaction[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
"""
content = content.replace('const [isTransferring, setIsTransferring] = useState(false)', 'const [isTransferring, setIsTransferring] = useState(false)' + state_hooks)

# 4. Add openHistoryDialog function
history_func = """
    const openHistoryDialog = async (wallet: Wallet) => {
        setHistoryWallet(wallet)
        setWalletTransactions([])
        setIsLoadingHistory(true)
        try {
            const res = await fetch(`/api/transactions?walletId=${wallet.id}&limit=50`)
            if (res.ok) {
                const data = await res.json()
                setWalletTransactions(data.transactions || [])
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Gagal memuat riwayat transaksi' })
        } finally {
            setIsLoadingHistory(false)
        }
    }
"""
content = content.replace('const handleRefresh = () => { setIsRefreshing(true); fetchWallets() }', 'const handleRefresh = () => { setIsRefreshing(true); fetchWallets() }' + history_func)

# 5. Add History Button to card
btn_history = """
                                                                <Button
                                                                    variant="ghost" size="icon"
                                                                    className="h-7 w-7 hover:bg-blue-100 text-blue-500"
                                                                    onClick={() => openHistoryDialog(wallet)}
                                                                    title="Riwayat Transaksi"
                                                                >
                                                                    <History className="h-3.5 w-3.5" />
                                                                </Button>
"""
old_btn = '<Button\n                                                                    variant="ghost" size="icon"\n                                                                    className="h-7 w-7 hover:bg-primary/10"'
content = content.replace(old_btn, btn_history + old_btn)

# 6. Add History Dialog at the end
history_dialog = """
            {/* History Dialog */}
            <Dialog open={!!historyWallet} onOpenChange={(open) => { if (!open) setHistoryWallet(null) }}>
                <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Riwayat Transaksi: {historyWallet?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto pr-2 mt-2 space-y-3">
                        {isLoadingHistory ? (
                            <div className="flex justify-center p-8"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                        ) : walletTransactions.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground">
                                Belum ada transaksi untuk dompet ini.
                            </div>
                        ) : (
                            walletTransactions.map(tx => {
                                const isIncome = tx.type === 'income' || (tx.type === 'transfer' && tx.toWallet?.name === historyWallet?.name)
                                const isExpense = tx.type === 'expense' || (tx.type === 'transfer' && tx.wallet?.name === historyWallet?.name)
                                
                                return (
                                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', 
                                                isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                            )}>
                                                {isIncome ? <ArrowDownRight className="h-4.5 w-4.5" /> : <ArrowUpRight className="h-4.5 w-4.5" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm line-clamp-1">
                                                    {tx.description || (tx.type === 'transfer' ? `Transfer ${isIncome ? 'dari ' + (tx.wallet?.name || 'dompet') : 'ke ' + (tx.toWallet?.name || 'dompet')}` : tx.type)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={cn('font-bold text-sm shrink-0', isIncome ? 'text-green-600' : 'text-red-600')}>
                                            {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </DialogContent>
            </Dialog>
"""
content = content.replace('</Dialog>\n        </div>\n    )\n}', '</Dialog>\n' + history_dialog + '        </div>\n    )\n}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
