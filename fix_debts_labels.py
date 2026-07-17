import os

filepath = 'src/app/(dashboard)/debts/page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update totalPaidOff and add currentSummary
old_paid_off = 'const totalPaidOff = summary ? summary.totalOriginalAmount - summary.totalRemainingAmount : 0'
new_paid_off = '''const currentSummary = activeTab === 'receivable' ? receivableSummary : summary;
    const totalPaidOff = currentSummary ? currentSummary.totalOriginalAmount - currentSummary.totalRemainingAmount : 0'''
content = content.replace(old_paid_off, new_paid_off)

# 2. Update summary usages in the UI
content = content.replace('{summary && (', '{currentSummary && (')
content = content.replace('summary.totalRemainingAmount', 'currentSummary.totalRemainingAmount')
content = content.replace('summary.totalOriginalAmount', 'currentSummary.totalOriginalAmount')
content = content.replace('summary.totalMonthlyPayment', 'currentSummary.totalMonthlyPayment')
content = content.replace('summary.count', 'currentSummary.count')

# 3. Update hardcoded text in Summary Cards
content = content.replace(
    '<TrendingDown className="h-4 w-4" /> Total Sisa Utang',
    '<TrendingDown className="h-4 w-4" /> {activeTab === "debt" ? "Total Sisa Utang" : "Total Sisa Piutang"}'
)
content = content.replace(
    'Dari seluruh utang',
    '{activeTab === "debt" ? "Dari seluruh utang" : "Dari seluruh piutang"}'
)
content = content.replace(
    '<CreditCard className="h-4 w-4" /> Jumlah Utang',
    '<CreditCard className="h-4 w-4" /> {activeTab === "debt" ? "Jumlah Utang" : "Jumlah Piutang"}'
)
content = content.replace(
    'Kewajiban aktif',
    '{activeTab === "debt" ? "Kewajiban aktif" : "Tagihan aktif"}'
)

# 4. Update text in the debt list cards
content = content.replace(
    '<p className="text-xs text-muted-foreground">Sisa Utang</p>',
    '<p className="text-xs text-muted-foreground">{activeTab === "debt" ? "Sisa Utang" : "Sisa Piutang"}</p>'
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Debt labels fixed!")
