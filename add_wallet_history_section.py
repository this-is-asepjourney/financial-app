import re

file_path = r'd:\repository\financial-app\src\app\(dashboard)\wallets\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We will add a new state for the selected wallet in the report section
state_hooks = """
    const [reportWalletId, setReportWalletId] = useState<string>('all')
    const [reportTransactions, setReportTransactions] = useState<Transaction[]>([])
    const [isLoadingReport, setIsLoadingReport] = useState(false)

    const fetchReportTransactions = useCallback(async (walletId: string) => {
        setIsLoadingReport(true)
        try {
            const url = walletId === 'all' 
                ? '/api/transactions?limit=10' 
                : `/api/transactions?walletId=${walletId}&limit=50`
            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setReportTransactions(data.transactions || [])
            }
        } catch (error) {
            console.error('Failed to fetch report transactions')
        } finally {
            setIsLoadingReport(false)
        }
    }, [])

    useEffect(() => {
        fetchReportTransactions(reportWalletId)
    }, [reportWalletId, fetchReportTransactions])
"""
content = content.replace('const [isLoadingHistory, setIsLoadingHistory] = useState(false)', 'const [isLoadingHistory, setIsLoadingHistory] = useState(false)' + state_hooks)


# We will insert the UI section just above the `<style jsx global>` tag
report_section = """
            {/* Laporan Aliran Dana Section */}
            <div className="mt-12 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            <ArrowRightLeft className="h-5 w-5 text-primary" />
                            Laporan Aliran Dana
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">Pantau transaksi masuk dan keluar untuk setiap dompet</p>
                    </div>
                    <div className="w-full sm:w-[250px]">
                        <Select value={reportWalletId} onValueChange={setReportWalletId}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Pilih Dompet" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Dompet (10 Terakhir)</SelectItem>
                                {wallets.map(w => (
                                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Card className="border shadow-sm">
                    <CardContent className="p-0">
                        {isLoadingReport ? (
                            <div className="flex justify-center p-12">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : reportTransactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <History className="h-12 w-12 text-muted-foreground/50 mb-3" />
                                <p className="text-muted-foreground">Belum ada transaksi untuk dompet ini.</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {reportTransactions.map(tx => {
                                    const isIncome = tx.type === 'income' || (tx.type === 'transfer' && tx.toWalletId === reportWalletId)
                                    const isExpense = tx.type === 'expense' || (tx.type === 'transfer' && tx.walletId === reportWalletId)
                                    
                                    // If 'all' is selected, color income green, expense red, transfer blue
                                    let iconColor = ''
                                    let textColor = ''
                                    let amountPrefix = ''
                                    let Icon = ArrowRightLeft
                                    
                                    if (reportWalletId === 'all') {
                                        if (tx.type === 'income') { iconColor = 'bg-green-100 text-green-600'; textColor = 'text-green-600'; amountPrefix = '+'; Icon = ArrowDownRight }
                                        else if (tx.type === 'expense') { iconColor = 'bg-red-100 text-red-600'; textColor = 'text-red-600'; amountPrefix = '-'; Icon = ArrowUpRight }
                                        else { iconColor = 'bg-blue-100 text-blue-600'; textColor = 'text-blue-600'; amountPrefix = ''; Icon = ArrowRightLeft }
                                    } else {
                                        if (isIncome) { iconColor = 'bg-green-100 text-green-600'; textColor = 'text-green-600'; amountPrefix = '+'; Icon = ArrowDownRight }
                                        else { iconColor = 'bg-red-100 text-red-600'; textColor = 'text-red-600'; amountPrefix = '-'; Icon = ArrowUpRight }
                                    }

                                    return (
                                        <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', iconColor)}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">
                                                        {tx.description || (tx.type === 'transfer' ? `Transfer ${tx.wallet?.name ? 'dari ' + tx.wallet.name : ''} ${tx.toWallet?.name ? 'ke ' + tx.toWallet.name : ''}` : tx.type)}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {tx.category?.name && (
                                                            <>
                                                                <span className="text-muted-foreground/30">•</span>
                                                                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                                    {tx.category.name}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={cn('font-bold', textColor)}>
                                                    {amountPrefix}{formatCurrency(tx.amount)}
                                                </p>
                                                {reportWalletId === 'all' && tx.wallet?.name && (
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                        {tx.wallet.name} {tx.toWallet?.name ? `→ ${tx.toWallet.name}` : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
"""
content = content.replace('<style jsx global>', report_section + '\n            <style jsx global>')

# Ensure `toWalletId` and `walletId` and `category` are in `Transaction` interface
tx_interface_updated = """
interface Transaction {
    id: string
    amount: number
    type: 'income' | 'expense' | 'transfer'
    description: string | null
    date: string
    walletId?: string | null
    toWalletId?: string | null
    wallet?: { name: string } | null
    toWallet?: { name: string } | null
    category?: { name: string, icon?: string } | null
}
"""
content = re.sub(r'interface Transaction \{[\s\S]*?\}', tx_interface_updated.strip(), content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
