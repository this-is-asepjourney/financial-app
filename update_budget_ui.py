import re

file_path = r'd:\repository\financial-app\src\app\(dashboard)\budget\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update lucide-react imports to include ChevronDown, ChevronUp, RefreshCw, ArrowRightLeft, Wallet (if missing)
lucide_import_pattern = r"from 'lucide-react'"
# find the import block
import_block_match = re.search(r"import \{([^}]+)\} from 'lucide-react'", content)
if import_block_match:
    imports = import_block_match.group(1)
    if 'ChevronDown' not in imports:
        imports += ", ChevronDown, ChevronUp, RefreshCw, ArrowRightLeft, Wallet"
    new_import_block = f"import {{{imports}}} from 'lucide-react'"
    content = content.replace(import_block_match.group(0), new_import_block)

# 2. Update BudgetCard signature and add states/fetch logic
old_budget_card = """// Helper Component for Budget Card
function BudgetCard({ budget, onEdit, onDelete, onPay, isPaid }: { budget: Budget, onEdit: () => void, onDelete: () => void, onPay?: () => void, isPaid: boolean }) {
    const percentage = calculatePercentage(budget.spent, budget.amount)
    const isOverBudget = budget.spent > budget.amount"""

new_budget_card = """// Helper Component for Budget Card
function BudgetCard({ budget, onEdit, onDelete, onPay, isPaid }: { budget: Budget, onEdit: () => void, onDelete: () => void, onPay?: () => void, isPaid: boolean }) {
    const percentage = calculatePercentage(budget.spent, budget.amount)
    const isOverBudget = budget.spent > budget.amount
    
    const [isExpanded, setIsExpanded] = useState(false)
    const [transactions, setTransactions] = useState<any[]>([])
    const [isLoadingTx, setIsLoadingTx] = useState(false)

    const fetchTransactions = async () => {
        setIsLoadingTx(true)
        try {
            // budget.month is e.g. '2023-10-01', we can pass it directly as month param
            const res = await fetch(`/api/transactions?categoryId=${budget.category.id}&month=${budget.month.substring(0, 7)}&limit=50`)
            if (res.ok) {
                const data = await res.json()
                setTransactions(data.transactions || [])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoadingTx(false)
        }
    }

    const toggleExpand = () => {
        if (!isExpanded && transactions.length === 0) {
            fetchTransactions()
        }
        setIsExpanded(!isExpanded)
    }"""

content = content.replace(old_budget_card, new_budget_card)

# 3. Add the accordion to the end of BudgetCard
old_card_end = """                    {/* Pay Button for Unpaid Bills */}
                    {!isPaid && onPay && (
                        <div className="pt-3">
                            <Button className="w-full gap-2" onClick={onPay}>
                                <CreditCard className="h-4 w-4" /> Bayar Sisa Tagihan
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}"""

new_card_end = """                    {/* Pay Button for Unpaid Bills */}
                    {!isPaid && onPay && (
                        <div className="pt-3">
                            <Button className="w-full gap-2" onClick={onPay}>
                                <CreditCard className="h-4 w-4" /> Bayar Sisa Tagihan
                            </Button>
                        </div>
                    )}
                    
                    {/* Transactions Dropdown (Accordion) */}
                    <div className="pt-4 mt-2 border-t border-slate-100">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full flex items-center justify-between text-muted-foreground hover:text-primary h-8"
                            onClick={toggleExpand}
                        >
                            <span className="text-xs font-semibold">Riwayat Transaksi Tagihan Ini</span>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        
                        {isExpanded && (
                            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {isLoadingTx ? (
                                    <div className="flex justify-center p-4">
                                        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                ) : transactions.length === 0 ? (
                                    <p className="text-center text-xs text-muted-foreground p-4">Belum ada transaksi</p>
                                ) : (
                                    transactions.map(tx => (
                                        <div key={tx.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded border border-slate-100 text-sm">
                                            <div>
                                                <p className="font-medium text-xs leading-tight line-clamp-1">{tx.description || tx.category?.name || 'Transaksi'}</p>
                                                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                                    <span>{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-0.5"><Wallet className="h-3 w-3" /> {tx.wallet?.name || 'Unknown'}</span>
                                                </div>
                                            </div>
                                            <p className="font-bold text-xs text-red-600 shrink-0">
                                                -{formatCurrency(tx.amount)}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}"""

content = content.replace(old_card_end, new_card_end)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
